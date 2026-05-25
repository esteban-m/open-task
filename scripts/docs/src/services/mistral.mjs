import { sanitizeApiText } from './sanitize.mjs';

const MISTRAL_URL = 'https://api.mistral.ai/v1/chat/completions';
const RETRYABLE_STATUSES = new Set([429, 502, 503, 504]);

const DEFAULT_RETRY = {
  maxAttempts: 6,
  baseDelayMs: 2_000,
  maxDelayMs: 60_000,
};

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function parseRetryAfterMs(response, fallbackMs) {
  const raw = response.headers?.get?.('retry-after');
  if (!raw) return fallbackMs;
  const seconds = Number(raw);
  if (Number.isFinite(seconds) && seconds >= 0) return seconds * 1_000;
  const until = Date.parse(raw);
  if (!Number.isNaN(until)) return Math.max(0, until - Date.now());
  return fallbackMs;
}

function resolveRetryOptions(retry) {
  const maxAttempts = retry?.maxAttempts ?? DEFAULT_RETRY.maxAttempts;
  const baseDelayMs = retry?.baseDelayMs ?? DEFAULT_RETRY.baseDelayMs;
  const maxDelayMs = retry?.maxDelayMs ?? DEFAULT_RETRY.maxDelayMs;
  return { maxAttempts, baseDelayMs, maxDelayMs };
}

export async function chatCompletion({
  apiKey,
  model,
  messages,
  maxTokens = 8000,
  temperature = 0.2,
  responseFormat,
  retry,
  cooldownBeforeMs = 0,
}) {
  if (cooldownBeforeMs > 0) await sleep(cooldownBeforeMs);

  const safeMessages = messages.map((m) => ({
    role: m.role,
    content: sanitizeApiText(m.content),
  }));

  const body = { model, messages: safeMessages, max_tokens: maxTokens, temperature };
  if (responseFormat) body.response_format = responseFormat;

  const { maxAttempts, baseDelayMs, maxDelayMs } = resolveRetryOptions(retry);

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    // codeql[js/file-access-to-http]: prompts bounded via sanitizeApiText before Mistral
    const response = await fetch(MISTRAL_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
    });

    if (response.ok) {
      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;
      if (!content) throw new Error('Mistral: réponse vide');
      return content.trim();
    }

    const text = await response.text();
    if (response.status === 401 || response.status === 403) {
      throw new Error(
        `Mistral ${response.status}: clé API refusée. `
          + 'Vérifiez MISTRAL_API_KEY (https://console.mistral.ai/) — pas une clé OpenRouter. '
          + text.slice(0, 200),
      );
    }

    if (RETRYABLE_STATUSES.has(response.status) && attempt < maxAttempts) {
      const backoff = Math.min(maxDelayMs, baseDelayMs * 2 ** (attempt - 1));
      const delayMs = parseRetryAfterMs(response, backoff);
      console.warn(
        `[mistral] ${response.status} — attente ${Math.ceil(delayMs / 1_000)}s `
          + `(retry ${attempt}/${maxAttempts - 1})`,
      );
      await sleep(delayMs);
      continue;
    }

    throw new Error(`Mistral ${response.status}: ${text.slice(0, 500)}`);
  }

  throw new Error('Mistral: échec après retries');
}

export function extractMermaidBlock(text) {
  const fenced = text.match(/```(?:mermaid)?\s*([\s\S]*?)```/i);
  if (fenced) return fenced[1].trim();
  if (text.startsWith('flowchart') || text.startsWith('graph ') || text.startsWith('erDiagram')) {
    return text.trim();
  }
  return null;
}

export function extractXmlTag(text, tag) {
  const match = text.match(new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`, 'i'));
  return match ? match[1].trim() : text.trim();
}

/** Clé et modèle Mistral (priorité MISTRAL_API_KEY, plus de OpenRouter). */
export function resolveMistralCredentials(env, config) {
  const raw = env.MISTRAL_API_KEY?.trim();
  if (!raw) throw new Error('MISTRAL_API_KEY manquant');
  if (/^sk-or-v1-/i.test(raw)) {
    throw new Error(
      'MISTRAL_API_KEY ressemble à une clé OpenRouter (sk-or-v1-…). '
        + 'Créez une clé sur https://console.mistral.ai/ et mettez-la dans le secret MISTRAL_API_KEY.',
    );
  }
  const model = (env.MISTRAL_MODEL ?? config.mistral.defaultModel).trim();
  return { apiKey: raw, model };
}

/** Options retry + cooldown pour les appels Mistral (config + env). */
export function resolveMistralRequestOptions(env, config) {
  const retryFromEnv = env.MISTRAL_RETRY_MAX ? { maxAttempts: Number(env.MISTRAL_RETRY_MAX) } : {};
  const delayFromEnv = env.MISTRAL_REQUEST_DELAY_MS
    ? Number(env.MISTRAL_REQUEST_DELAY_MS)
    : config.mistral.requestDelayMs ?? 1_500;

  return {
    retry: { ...config.mistral.retry, ...retryFromEnv },
    requestDelayMs: delayFromEnv,
  };
}

export function isMistralCapacityError(status, bodyText) {
  if (status !== 429) return false;
  try {
    const payload = JSON.parse(bodyText);
    return payload.code === '3505' || payload.type === 'service_tier_capacity_exceeded';
  } catch {
    return /service_tier_capacity_exceeded|"code":"3505"/.test(bodyText);
  }
}

export function isCapacityExceededError(err) {
  const msg = String(err?.message ?? err);
  return isMistralCapacityError(429, msg) || /service_tier_capacity_exceeded/.test(msg);
}

/** Ping minimal Mistral — lève une erreur explicite si la clé est invalide. */
export async function validateMistralApiKey(
  apiKey,
  model = 'mistral-small-latest',
  { retry, fallbackModels = [] } = {},
) {
  const key = apiKey?.trim();
  if (!key) throw new Error('MISTRAL_API_KEY manquant');

  const models = [model, ...fallbackModels.filter((m) => m && m !== model)].filter(Boolean);
  let lastError;

  for (const tryModel of models) {
    try {
      await chatCompletion({
        apiKey: key,
        model: tryModel,
        messages: [{ role: 'user', content: 'ping' }],
        maxTokens: 8,
        temperature: 0,
        retry,
      });
      if (tryModel !== model) {
        console.warn(`[mistral] validation OK via modèle de secours: ${tryModel}`);
      }
      return tryModel;
    } catch (err) {
      lastError = err;
      const hasFallback = tryModel !== models.at(-1);
      if (isCapacityExceededError(err) && hasFallback) {
        console.warn(`[mistral] capacité saturée sur ${tryModel}, essai modèle suivant…`);
        continue;
      }
      throw err;
    }
  }

  throw lastError ?? new Error('Mistral: validation échouée');
}

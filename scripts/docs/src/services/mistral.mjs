import { sanitizeApiText } from './sanitize.mjs';

const MISTRAL_URL = 'https://api.mistral.ai/v1/chat/completions';

export async function chatCompletion({
  apiKey,
  model,
  messages,
  maxTokens = 8000,
  temperature = 0.2,
  responseFormat,
}) {
  const safeMessages = messages.map((m) => ({
    role: m.role,
    content: sanitizeApiText(m.content),
  }));

  const body = { model, messages: safeMessages, max_tokens: maxTokens, temperature };
  if (responseFormat) body.response_format = responseFormat;

  // codeql[js/file-access-to-http]: prompts bounded via sanitizeApiText before Mistral
  const response = await fetch(MISTRAL_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Mistral ${response.status}: ${text.slice(0, 500)}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error('Mistral: réponse vide');
  return content.trim();
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
  const apiKey = env.MISTRAL_API_KEY;
  if (!apiKey) throw new Error('MISTRAL_API_KEY manquant');
  const model = env.MISTRAL_MODEL ?? config.mistral.defaultModel;
  return { apiKey, model };
}

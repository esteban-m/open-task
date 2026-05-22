import { sanitizeApiText } from './sanitize.mjs';

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';

export async function chatCompletion({
  apiKey,
  model,
  messages,
  maxTokens = 8000,
  temperature = 0.2,
  responseFormat,
  referer,
  appName,
}) {
  const safeMessages = messages.map((m) => ({
    role: m.role,
    content: sanitizeApiText(m.content),
  }));

  const body = { model, messages: safeMessages, max_tokens: maxTokens, temperature };
  if (responseFormat) body.response_format = responseFormat;

  // codeql[js/file-access-to-http]: prompts bounded via sanitizeApiText before OpenRouter
  const response = await fetch(OPENROUTER_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
      'HTTP-Referer': referer ?? process.env.OPENROUTER_SITE_URL ?? 'https://github.com',
      'X-Title': appName ?? process.env.OPENROUTER_APP_NAME ?? 'Docs',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`OpenRouter ${response.status}: ${text.slice(0, 500)}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error('OpenRouter: réponse vide');
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

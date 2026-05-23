import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  chatCompletion,
  extractMermaidBlock,
  extractXmlTag,
  resolveMistralCredentials,
  validateMistralApiKey,
} from '../src/services/mistral.mjs';

describe('mistral helpers', () => {
  it('extractMermaidBlock from fenced block', () => {
    const text = 'Here\n```mermaid\nflowchart LR\n  A --> B\n```\n';
    expect(extractMermaidBlock(text)).toContain('flowchart LR');
  });

  it('extractMermaidBlock from raw flowchart', () => {
    expect(extractMermaidBlock('flowchart TB\n  A --> B')).toBe('flowchart TB\n  A --> B');
  });

  it('extractMermaidBlock returns null when no diagram', () => {
    expect(extractMermaidBlock('plain text')).toBeNull();
  });

  it('extractXmlTag returns inner content', () => {
    const text = '<explanation>Hello world</explanation>';
    expect(extractXmlTag(text, 'explanation')).toBe('Hello world');
  });

  it('resolveMistralCredentials requires MISTRAL_API_KEY', () => {
    expect(() => resolveMistralCredentials({}, { mistral: { defaultModel: 'mistral-small-latest' } })).toThrow(
      'MISTRAL_API_KEY manquant',
    );
  });

  it('resolveMistralCredentials rejects OpenRouter-shaped keys', () => {
    expect(() =>
      resolveMistralCredentials(
        { MISTRAL_API_KEY: 'sk-or-v1-deadbeef' },
        { mistral: { defaultModel: 'mistral-small-latest' } },
      ),
    ).toThrow(/OpenRouter/);
  });

  it('resolveMistralCredentials trims whitespace', () => {
    const creds = resolveMistralCredentials(
      { MISTRAL_API_KEY: '  test-key  ' },
      { mistral: { defaultModel: 'mistral-small-latest' } },
    );
    expect(creds.apiKey).toBe('test-key');
  });

  it('resolveMistralCredentials uses env model override', () => {
    const creds = resolveMistralCredentials(
      { MISTRAL_API_KEY: 'test-key', MISTRAL_MODEL: 'mistral-large-latest' },
      { mistral: { defaultModel: 'mistral-small-latest' } },
    );
    expect(creds.apiKey).toBe('test-key');
    expect(creds.model).toBe('mistral-large-latest');
  });
});

describe('chatCompletion', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('returns trimmed assistant content', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: '  réponse IA  ' } }],
      }),
    });

    const out = await chatCompletion({
      apiKey: 'key-test',
      model: 'mistral-small-latest',
      messages: [{ role: 'user', content: 'ping' }],
      maxTokens: 32,
    });

    expect(out).toBe('réponse IA');
    expect(globalThis.fetch).toHaveBeenCalledWith(
      'https://api.mistral.ai/v1/chat/completions',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({ Authorization: 'Bearer key-test' }),
      }),
    );
  });

  it('includes response_format when provided', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: '{}' } }],
      }),
    });

    await chatCompletion({
      apiKey: 'key-test',
      model: 'mistral-small-latest',
      messages: [{ role: 'user', content: 'json' }],
      responseFormat: { type: 'json_object' },
    });

    const body = JSON.parse(globalThis.fetch.mock.calls[0][1].body);
    expect(body.response_format).toEqual({ type: 'json_object' });
  });

  it('throws on HTTP error', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      text: async () => '{"detail":"Unauthorized"}',
    });

    await expect(
      chatCompletion({
        apiKey: 'bad',
        model: 'mistral-small-latest',
        messages: [{ role: 'user', content: 'x' }],
      }),
    ).rejects.toThrow(/clé API refusée/);
  });

  it('throws on non-auth HTTP error', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 429,
      text: async () => 'rate limit',
    });

    await expect(
      chatCompletion({
        apiKey: 'key-test',
        model: 'mistral-small-latest',
        messages: [{ role: 'user', content: 'x' }],
      }),
    ).rejects.toThrow('Mistral 429');
  });

  it('throws on empty content', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ choices: [{ message: { content: '' } }] }),
    });

    await expect(
      chatCompletion({
        apiKey: 'key-test',
        model: 'mistral-small-latest',
        messages: [{ role: 'user', content: 'x' }],
      }),
    ).rejects.toThrow('Mistral: réponse vide');
  });
});

describe('validateMistralApiKey', () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('ping réussi', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ choices: [{ message: { content: 'pong' } }] }),
    });

    await validateMistralApiKey('  key-test  ');
    expect(globalThis.fetch).toHaveBeenCalled();
  });

  it('exige une clé', async () => {
    await expect(validateMistralApiKey('')).rejects.toThrow('MISTRAL_API_KEY manquant');
  });
});

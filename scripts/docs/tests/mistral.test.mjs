import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  chatCompletion,
  extractMermaidBlock,
  extractXmlTag,
  resolveMistralCredentials,
  resolveMistralRequestOptions,
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

  it('resolveMistralRequestOptions merges config and env', () => {
    const opts = resolveMistralRequestOptions(
      { MISTRAL_RETRY_MAX: '8', MISTRAL_REQUEST_DELAY_MS: '2500' },
      {
        mistral: {
          requestDelayMs: 1500,
          retry: { maxAttempts: 6, baseDelayMs: 2000, maxDelayMs: 60000 },
        },
      },
    );
    expect(opts.requestDelayMs).toBe(2500);
    expect(opts.retry.maxAttempts).toBe(8);
    expect(opts.retry.baseDelayMs).toBe(2000);
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

  it('throws on non-auth HTTP error after retries exhausted', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 429,
      headers: { get: () => null },
      text: async () => 'rate limit',
    });

    await expect(
      chatCompletion({
        apiKey: 'key-test',
        model: 'mistral-small-latest',
        messages: [{ role: 'user', content: 'x' }],
        retry: { maxAttempts: 1 },
      }),
    ).rejects.toThrow('Mistral 429');
  });

  it('retries on 429 then succeeds', async () => {
    vi.useFakeTimers();
    globalThis.fetch = vi
      .fn()
      .mockResolvedValueOnce({
        ok: false,
        status: 429,
        headers: { get: () => '1' },
        text: async () => '{"message":"Rate limit exceeded"}',
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ choices: [{ message: { content: 'ok' } }] }),
      });

    const promise = chatCompletion({
      apiKey: 'key-test',
      model: 'mistral-small-latest',
      messages: [{ role: 'user', content: 'x' }],
      retry: { maxAttempts: 3, baseDelayMs: 1000, maxDelayMs: 5000 },
    });

    await vi.runAllTimersAsync();
    await expect(promise).resolves.toBe('ok');
    expect(globalThis.fetch).toHaveBeenCalledTimes(2);
    vi.useRealTimers();
  });

  it('waits cooldownBeforeMs before first request', async () => {
    vi.useFakeTimers();
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ choices: [{ message: { content: 'ok' } }] }),
    });

    const promise = chatCompletion({
      apiKey: 'key-test',
      model: 'mistral-small-latest',
      messages: [{ role: 'user', content: 'x' }],
      cooldownBeforeMs: 500,
    });

    expect(globalThis.fetch).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(500);
    await expect(promise).resolves.toBe('ok');
    vi.useRealTimers();
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

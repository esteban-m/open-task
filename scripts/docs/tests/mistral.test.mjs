import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  chatCompletion,
  extractMermaidBlock,
  extractXmlTag,
  isMistralCapacityError,
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

  it('extractMermaidBlock from graph and erDiagram', () => {
    expect(extractMermaidBlock('graph TD\n  A --> B')).toContain('graph TD');
    expect(extractMermaidBlock('erDiagram\n  USER ||--o{ TASK : has')).toContain('erDiagram');
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

  it('resolveMistralRequestOptions uses config defaults', () => {
    const opts = resolveMistralRequestOptions(
      {},
      { mistral: { requestDelayMs: 1200, retry: { maxAttempts: 5 } } },
    );
    expect(opts.requestDelayMs).toBe(1200);
    expect(opts.retry.maxAttempts).toBe(5);
  });

  it('resolveMistralRequestOptions retombe sur 1500 ms si requestDelayMs absent', () => {
    const opts = resolveMistralRequestOptions({}, { mistral: { retry: { maxAttempts: 5 } } });
    expect(opts.requestDelayMs).toBe(1500);
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

  it('retries on 503 with Retry-After date header', async () => {
    vi.useFakeTimers();
    const future = new Date(Date.now() + 500).toUTCString();
    globalThis.fetch = vi
      .fn()
      .mockResolvedValueOnce({
        ok: false,
        status: 503,
        headers: { get: (name) => (name === 'retry-after' ? future : null) },
        text: async () => 'unavailable',
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ choices: [{ message: { content: 'ok' } }] }),
      });

    const promise = chatCompletion({
      apiKey: 'key-test',
      model: 'mistral-small-latest',
      messages: [{ role: 'user', content: 'x' }],
      retry: { maxAttempts: 2, baseDelayMs: 10_000, maxDelayMs: 60_000 },
    });

    await vi.runAllTimersAsync();
    await expect(promise).resolves.toBe('ok');
    vi.useRealTimers();
  });

  it('uses fallback delay when Retry-After is invalid', async () => {
    vi.useFakeTimers();
    globalThis.fetch = vi
      .fn()
      .mockResolvedValueOnce({
        ok: false,
        status: 429,
        headers: { get: () => 'not-a-date' },
        text: async () => 'rate limit',
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ choices: [{ message: { content: 'ok' } }] }),
      });

    const promise = chatCompletion({
      apiKey: 'key-test',
      model: 'mistral-small-latest',
      messages: [{ role: 'user', content: 'x' }],
      retry: { maxAttempts: 2, baseDelayMs: 100, maxDelayMs: 200 },
    });

    await vi.runAllTimersAsync();
    await expect(promise).resolves.toBe('ok');
    vi.useRealTimers();
  });

  it('throws when maxAttempts is zero', async () => {
    await expect(
      chatCompletion({
        apiKey: 'key-test',
        model: 'mistral-small-latest',
        messages: [{ role: 'user', content: 'x' }],
        retry: { maxAttempts: 0 },
      }),
    ).rejects.toThrow('Mistral: échec après retries');
  });

  it('throws after all retryable attempts fail', async () => {
    vi.useFakeTimers();
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 429,
      headers: { get: () => null },
      text: async () => 'rate limit',
    });

    const promise = chatCompletion({
      apiKey: 'key-test',
      model: 'mistral-small-latest',
      messages: [{ role: 'user', content: 'x' }],
      retry: { maxAttempts: 2, baseDelayMs: 10, maxDelayMs: 20 },
    });

    const expectation = expect(promise).rejects.toThrow('Mistral 429');
    await vi.runAllTimersAsync();
    await expectation;
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

describe('isMistralCapacityError', () => {
  it('détecte le code 3505', () => {
    const body = JSON.stringify({
      type: 'service_tier_capacity_exceeded',
      code: '3505',
      message: 'Service tier capacity exceeded for this model.',
    });
    expect(isMistralCapacityError(429, body)).toBe(true);
    expect(isMistralCapacityError(500, body)).toBe(false);
  });

  it('détecte le type sans code JSON', () => {
    const body = JSON.stringify({ type: 'service_tier_capacity_exceeded' });
    expect(isMistralCapacityError(429, body)).toBe(true);
  });

  it('détecte via regex si le corps n’est pas du JSON', () => {
    expect(isMistralCapacityError(429, 'service_tier_capacity_exceeded')).toBe(true);
    expect(isMistralCapacityError(429, '{"code":"3505"}')).toBe(true);
    expect(isMistralCapacityError(429, '{"type":"rate_limit"}')).toBe(false);
  });
});

describe('validateMistralApiKey', () => {
  const originalFetch = globalThis.fetch;
  const capacityBody = JSON.stringify({
    object: 'error',
    type: 'service_tier_capacity_exceeded',
    code: '3505',
    message: 'Service tier capacity exceeded for this model.',
  });

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

  it('relance une erreur auth sans essayer le fallback', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      headers: { get: () => null },
      text: async () => 'unauthorized',
    });

    await expect(
      validateMistralApiKey('key-test', 'mistral-small-latest', {
        fallbackModels: ['open-mistral-nemo'],
        retry: { maxAttempts: 1, baseDelayMs: 0, maxDelayMs: 0 },
      }),
    ).rejects.toThrow('401');
    expect(globalThis.fetch).toHaveBeenCalledTimes(1);
  });

  it('échoue si tous les modèles sont saturés', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 429,
      headers: { get: () => null },
      text: async () => capacityBody,
    });

    await expect(
      validateMistralApiKey('key-test', 'mistral-small-latest', {
        fallbackModels: ['open-mistral-nemo'],
        retry: { maxAttempts: 1, baseDelayMs: 0, maxDelayMs: 0 },
      }),
    ).rejects.toThrow('3505');
    expect(globalThis.fetch).toHaveBeenCalledTimes(2);
  });

  it('bascule sur un modèle de secours si capacité saturée', async () => {
    globalThis.fetch = vi
      .fn()
      .mockResolvedValueOnce({
        ok: false,
        status: 429,
        headers: { get: () => null },
        text: async () => capacityBody,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ choices: [{ message: { content: 'pong' } }] }),
      });

    const model = await validateMistralApiKey('key-test', 'mistral-small-latest', {
      fallbackModels: ['open-mistral-nemo'],
      retry: { maxAttempts: 1, baseDelayMs: 0, maxDelayMs: 0 },
    });

    expect(model).toBe('open-mistral-nemo');
    expect(globalThis.fetch).toHaveBeenCalledTimes(2);
  });

  it('exige une clé', async () => {
    await expect(validateMistralApiKey('')).rejects.toThrow('MISTRAL_API_KEY manquant');
  });
});

import { afterEach, describe, expect, it, vi } from 'vitest';

describe('runValidateMistral (integration)', () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.resetModules();
  });

  it('valide la clé avec les fallbackModels du fichier config', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ choices: [{ message: { content: 'pong' } }] }),
    });

    const { runValidateMistral } = await import('../src/commands/validate-mistral.mjs');
    const model = await runValidateMistral({ MISTRAL_API_KEY: 'integration-test-key' });

    expect(model).toBe('mistral-small-latest');
    expect(globalThis.fetch).toHaveBeenCalled();
  });
});

import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../src/core/config.mjs', () => ({
  loadConfig: vi.fn(async () => ({ mistral: { defaultModel: 'mistral-small-latest' } })),
}));

vi.mock('../src/services/mistral.mjs', () => ({
  resolveMistralCredentials: vi.fn(() => ({ apiKey: 'test-key', model: 'mistral-small-latest' })),
  resolveMistralRequestOptions: vi.fn(() => ({ retry: { maxAttempts: 8 }, requestDelayMs: 1500 })),
  validateMistralApiKey: vi.fn(async () => 'mistral-small-latest'),
}));

const { runValidateMistral } = await import('../src/commands/validate-mistral.mjs');
const { resolveMistralCredentials, validateMistralApiKey } = await import('../src/services/mistral.mjs');

describe('runValidateMistral', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('résout les credentials et valide la clé', async () => {
    const model = await runValidateMistral({ MISTRAL_API_KEY: 'test-key' });
    expect(model).toBe('mistral-small-latest');
    expect(resolveMistralCredentials).toHaveBeenCalled();
    expect(validateMistralApiKey).toHaveBeenCalledWith(
      'test-key',
      'mistral-small-latest',
      expect.objectContaining({ retry: expect.any(Object), fallbackModels: expect.any(Array) }),
    );
  });
});

import { describe, expect, it } from 'vitest';

import { extractMermaidBlock, extractXmlTag, resolveMistralCredentials } from '../src/services/mistral.mjs';

describe('mistral helpers', () => {
  it('extractMermaidBlock from fenced block', () => {
    const text = 'Here\n```mermaid\nflowchart LR\n  A --> B\n```\n';
    expect(extractMermaidBlock(text)).toContain('flowchart LR');
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

  it('resolveMistralCredentials uses env model override', () => {
    const creds = resolveMistralCredentials(
      { MISTRAL_API_KEY: 'test-key', MISTRAL_MODEL: 'mistral-large-latest' },
      { mistral: { defaultModel: 'mistral-small-latest' } },
    );
    expect(creds.apiKey).toBe('test-key');
    expect(creds.model).toBe('mistral-large-latest');
  });
});

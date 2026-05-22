import { describe, expect, it } from 'vitest'

import { sanitizeMermaid } from '../src/services/mermaid.mjs'

describe('mermaid', () => {
  it('quotes node labels with special characters', () => {
    const input = 'flowchart TB\n  A[API: REST] --> B';
    const out = sanitizeMermaid(input);
    expect(out).toContain('A["API: REST"]');
  });
});

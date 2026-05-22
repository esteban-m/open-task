import { describe, expect, it } from 'vitest'

import { extractMermaidBlock, extractXmlTag } from '../src/services/openrouter.mjs'

describe('openrouter helpers', () => {
  it('extractMermaidBlock from fenced block', () => {
    const text = 'Here\n```mermaid\nflowchart LR\n  A --> B\n```\n';
    expect(extractMermaidBlock(text)).toContain('flowchart LR');
  });

  it('extractXmlTag returns inner content', () => {
    const text = '<explanation>Hello world</explanation>';
    expect(extractXmlTag(text, 'explanation')).toBe('Hello world');
  });
});

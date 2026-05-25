import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest'

import { fixMermaidInMarkdown, sanitizeMermaid } from '../src/services/mermaid.mjs'

describe('mermaid', () => {
  it('quotes node labels with special characters', () => {
    const input = 'flowchart TB\n  A[API: REST] --> B';
    const out = sanitizeMermaid(input);
    expect(out).toContain('A["API: REST"]');
  });

  it('leaves simple labels without special characters unchanged', () => {
    const input = 'flowchart TB\n  A[Simple] --> B';
    expect(sanitizeMermaid(input)).toContain('A[Simple]');
  });

  it('leaves already quoted labels unchanged', () => {
    const input = 'flowchart TB\n  A["Already quoted"] --> B';
    expect(sanitizeMermaid(input)).toContain('A["Already quoted"]');
  });

  it('preserve single-quoted bracket labels', () => {
    const input = "flowchart TB\n  A['Quoted'] --> B";
    expect(sanitizeMermaid(input)).toContain("A['Quoted']");
  });

  it('collapses excessive blank lines', () => {
    const input = 'flowchart LR\n  A --> B\n\n\n\n';
    expect(sanitizeMermaid(input).split('\n\n').length).toBeLessThan(input.split('\n\n').length);
  });

  it('fixMermaidInMarkdown updates file when block changes', async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), 'docs-mermaid-'));
    const file = path.join(dir, 'doc.md');
    await writeFile(file, '```mermaid\nflowchart LR\n  A[API: REST]\n```\n', 'utf8');

    try {
      const changed = await fixMermaidInMarkdown(file, readFile, writeFile);
      expect(changed).toBe(true);
      const content = await readFile(file, 'utf8');
      expect(content).toContain('A["API: REST"]');
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it('fixMermaidInMarkdown returns false when unchanged', async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), 'docs-mermaid-'));
    const file = path.join(dir, 'plain.md');
    await writeFile(file, '# No diagram\n', 'utf8');

    try {
      const changed = await fixMermaidInMarkdown(file, readFile, writeFile);
      expect(changed).toBe(false);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });
});

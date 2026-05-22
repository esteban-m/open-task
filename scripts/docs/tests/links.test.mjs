import { describe, expect, it } from 'vitest'

import {
  applyLinkRewrites,
  extractInternalDocPath,
  normalizeMarkdownLink,
  repairVoirAussiSection,
} from '../src/services/links.mjs'

describe('links', () => {
  const validLinks = new Set([
    '/generated/architecture',
    '/generated/api-reference',
    '/guide/getting-started',
    '/generated/frontend/state-management',
  ]);
  const rewrites = { '/generated/authentication': '/generated/backend/authentication' };

  it('extractInternalDocPath normalizes example.com and GitHub Pages URLs', () => {
    expect(extractInternalDocPath('https://example.com/generated/architecture')).toBe(
      '/generated/architecture',
    );
    expect(extractInternalDocPath('https://esteban-m.github.io/open-task/generated/api-reference')).toBe(
      '/generated/api-reference',
    );
    expect(extractInternalDocPath('/guide/getting-started')).toBe('/guide/getting-started');
  });

  it('normalizeMarkdownLink drops invalid external links', () => {
    expect(normalizeMarkdownLink('GitDiagram', 'https://github.com/ahmedkhaleel2004/gitdiagram', validLinks, rewrites)).toBe(
      'GitDiagram',
    );
    expect(
      normalizeMarkdownLink('Architecture', 'https://example.com/generated/architecture', validLinks, rewrites),
    ).toBe('[Architecture](/generated/architecture)');
  });

  it('applyLinkRewrites maps legacy paths', () => {
    expect(applyLinkRewrites('/generated/authentication', rewrites)).toBe(
      '/generated/backend/authentication',
    );
  });

  it('repairVoirAussiSection fixes broken voir aussi blocks', () => {
    const input = `## Voir aussi
- [Architecture système](https://example.com/generated/architecture)
- [API Reference](https://github.com/ahmedkhaleel2004/gitdiagram)
`;
    const out = repairVoirAussiSection(input, validLinks, rewrites);
    expect(out).toContain('[Architecture système](/generated/architecture)');
    expect(out).not.toContain('example.com');
    expect(out).not.toContain('gitdiagram');
  });
});

import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { beforeAll, describe, expect, it } from 'vitest'

import {
  applyLinkRewrites,
  buildDocTitleMaps,
  extractInternalDocPath,
  fixLinksInDir,
  normalizeMarkdownLink,
  normalizeRelativeHref,
  repairVoirAussiSection,
} from '../src/services/links.mjs'
import { loadConfig, resetConfigCache } from '../src/core/config.mjs'

describe('links', () => {
  const validLinks = new Set([
    '/generated/architecture',
    '/generated/api-reference',
    '/guide/getting-started',
    '/reference/environment',
    '/generated/frontend/state-management',
    '/generated/backend/authentication',
    '/generated/backend/security',
  ]);
  const rewrites = { '/generated/authentication': '/generated/backend/authentication' };
  let docMaps;
  let defaultSeeAlso;

  beforeAll(async () => {
    resetConfigCache();
    const config = await loadConfig();
    docMaps = buildDocTitleMaps(config);
    defaultSeeAlso = config.defaultSeeAlso;
  });

  describe('extractInternalDocPath', () => {
    it('returns null for anchors, mailto and empty', () => {
      expect(extractInternalDocPath('')).toBeNull();
      expect(extractInternalDocPath('#section')).toBeNull();
      expect(extractInternalDocPath('mailto:a@b.fr')).toBeNull();
    });

    it('normalizes example.com, GitHub Pages and trailing slashes', () => {
      expect(extractInternalDocPath('https://example.com/generated/architecture/')).toBe(
        '/generated/architecture',
      );
      expect(extractInternalDocPath('https://esteban-m.github.io/open-task/generated/api-reference')).toBe(
        '/generated/api-reference',
      );
      expect(extractInternalDocPath('/guide/getting-started/')).toBe('/guide/getting-started');
    });

    it('handles relative paths without protocol', () => {
      expect(extractInternalDocPath('generated/backend/tasks')).toBe('/generated/backend/tasks');
      expect(extractInternalDocPath('./guide/getting-started')).toBe('/guide/getting-started');
    });

    it('returns null for unrelated external URLs', () => {
      expect(extractInternalDocPath('https://github.com/foo/bar')).toBeNull();
    });
  });

  describe('normalizeMarkdownLink', () => {
    it('preserves mailto and hash-only links via early external check', () => {
      expect(normalizeMarkdownLink('Mail', 'mailto:x@y.fr', validLinks, rewrites)).toBe('Mail');
    });

    it('drops invalid external links', () => {
      expect(
        normalizeMarkdownLink('GitDiagram', 'https://github.com/ahmedkhaleel2004/gitdiagram', validLinks, rewrites),
      ).toBe('GitDiagram');
    });

    it('rewrites legacy paths before validation', () => {
      expect(
        normalizeMarkdownLink('Auth', '/generated/authentication', validLinks, rewrites),
      ).toBe('[Auth](/generated/backend/authentication)');
    });

    it('returns label when path is unknown', () => {
      expect(normalizeMarkdownLink('X', '/generated/unknown-page', validLinks, rewrites)).toBe('X');
    });

    it('normalizes paths without leading slash', () => {
      expect(
        normalizeMarkdownLink('Start', 'guide/getting-started', validLinks, rewrites),
      ).toBe('[Start](/guide/getting-started)');
    });
  });

  describe('normalizeRelativeHref', () => {
    it('prefixes internal relative paths', () => {
      expect(normalizeRelativeHref('operations/docker')).toBe('/operations/docker');
      expect(normalizeRelativeHref('./generated/architecture')).toBe('/generated/architecture');
      expect(normalizeRelativeHref('https://evil.com')).toBeNull();
    });
  });

  describe('applyLinkRewrites', () => {
    it('maps legacy paths and leaves others unchanged', () => {
      expect(applyLinkRewrites('/generated/authentication', rewrites)).toBe(
        '/generated/backend/authentication',
      );
      expect(applyLinkRewrites('/generated/architecture', rewrites)).toBe('/generated/architecture');
    });
  });

  describe('repairVoirAussiSection', () => {
    it('fixes broken voir aussi blocks', () => {
      const input = `## Voir aussi
- [Architecture système](https://example.com/generated/architecture)
- [API Reference](https://github.com/ahmedkhaleel2004/gitdiagram)
`;
      const out = repairVoirAussiSection(input, validLinks, rewrites, docMaps);
      expect(out).toContain('[Architecture système](/generated/architecture)');
      expect(out).not.toContain('example.com');
      expect(out).not.toContain('gitdiagram');
    });

    it('turns bare paths into clickable links', () => {
      const input = `## Voir aussi
/generated/backend/authentication
/generated/backend/security
/generated/api-reference
/guide/getting-started
`;
      const out = repairVoirAussiSection(input, validLinks, rewrites, docMaps);
      expect(out).toContain('[Authentification](/generated/backend/authentication)');
      expect(out).toContain('[Sécurité transverse](/generated/backend/security)');
      expect(out).toContain('[API REST](/generated/api-reference)');
      expect(out).not.toMatch(/^\/generated/m);
    });

    it('turns plain labels into clickable links and deduplicates', () => {
      const input = `## Voir aussi
- Architecture système
- API Reference
- Getting Started
- [Architecture système](/generated/architecture)
- [API REST](/generated/api-reference)
`;
      const out = repairVoirAussiSection(input, validLinks, rewrites, docMaps);
      const archCount = (out.match(/\/generated\/architecture/g) ?? []).length;
      expect(archCount).toBe(1);
      expect(out).toContain('[Architecture système](/generated/architecture)');
      expect(out).toContain('[Démarrage rapide](/guide/getting-started)');
    });

    it('injects defaultSeeAlso from config when section has no valid links', () => {
      const input = `## Voir aussi
- Broken only
`;
      const out = repairVoirAussiSection(input, validLinks, rewrites, docMaps);
      for (const { label, href } of defaultSeeAlso) {
        if (validLinks.has(href)) {
          expect(out).toContain(`[${label}](${href})`);
        }
      }
    });

    it('keeps valid relative links and preserves non-list lines', () => {
      const input = `## Voir aussi
Note intro

- [API REST](/generated/api-reference)

## Suite
`;
      const out = repairVoirAussiSection(input, validLinks, rewrites, docMaps);
      expect(out).toContain('Note intro');
      expect(out).toContain('[API REST](/generated/api-reference)');
      expect(out).toContain('## Suite');
    });
  });

  describe('fixLinksInDir', () => {
    it('rewrites markdown files on disk', async () => {
      const dir = await mkdtemp(path.join(os.tmpdir(), 'docs-links-'));
      const file = path.join(dir, 'architecture.md');
      await writeFile(
        file,
        `## Voir aussi
- [Bad](https://example.com/generated/architecture)
- [Legacy](/generated/authentication)
- [Mail](mailto:test@example.com)
`,
        'utf8',
      );

      const config = {
        navigation: {
          generatedPages: [{ link: '/generated/architecture', file: 'architecture.md' }],
          staticPages: [],
          categories: [],
          home: { link: '/', text: 'Home' },
        },
        chapters: [{ path: 'backend/authentication', title: 'Auth' }],
        linkRewrites: rewrites,
      };

      try {
        await fixLinksInDir(dir, config);
        const content = await readFile(file, 'utf8');
        expect(content).toContain('](/generated/architecture)');
        expect(content).toContain('](/generated/backend/authentication)');
        expect(content).not.toContain('example.com');
      } finally {
        await rm(dir, { recursive: true, force: true });
      }
    });
  });
});

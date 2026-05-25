import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  buildDocTitleMaps,
  extractInternalDocPath,
  fixLinksInDir,
  normalizeMarkdownLink,
  repairVoirAussiSection,
} from '../src/services/links.mjs';
import { writeGeneratedDoc } from '../src/services/writer.mjs';
import { buildLocalFileTree } from '../src/services/github.mjs';
import { fetchGithubTree } from '../src/services/github.mjs';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');

describe('coverage gaps — docs scripts', () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it('buildDocTitleMaps enregistre title et alias sans écraser', () => {
    const maps = buildDocTitleMaps({
      navigation: { generatedPages: [], staticPages: [] },
      chapters: [],
      defaultSeeAlso: [],
      linkLabelAliases: [
        { label: 'Alias', href: '/guide/x', title: 'Titre alias' },
        { label: 'Autre', href: '/guide/y' },
      ],
    });
    expect(maps.pathToTitle.get('/guide/x')).toBe('Titre alias');
    expect(maps.labelToHref.get('autre')).toBe('/guide/y');
  });

  it('extractInternalDocPath couvre //, open-task et chemins relatifs invalides', () => {
    expect(extractInternalDocPath(null)).toBeNull();
    expect(extractInternalDocPath('//evil.com/path')).toBeNull();
    expect(extractInternalDocPath('https://x.github.io/open-task/generated/architecture')).toBe(
      '/generated/architecture',
    );
    expect(extractInternalDocPath('not-a-valid-url')).toBeNull();
  });

  it('normalizeMarkdownLink ignore les liens https externes', () => {
    const valid = new Set(['/generated/architecture']);
    expect(
      normalizeMarkdownLink('Ext', 'https://example.com/page', valid, {}),
    ).toBe('Ext');
  });

  it('repairVoirAussiSection répare chemins absolus et labels seuls', () => {
    const valid = new Set(['/generated/architecture', '/guide/getting-started']);
    const maps = buildDocTitleMaps({
      navigation: {
        generatedPages: [{ link: '/generated/architecture', title: 'Architecture' }],
        staticPages: [{ link: '/guide/getting-started', title: 'Start' }],
      },
      chapters: [],
      defaultSeeAlso: [],
      linkLabelAliases: [],
    });
    const out = repairVoirAussiSection(
      `## Voir aussi
/generated/architecture
Getting Started
`,
      valid,
      {},
      maps,
    );
    expect(out).toContain('[Architecture](/generated/architecture)');
    expect(out).toContain('Getting Started');
  });

  it('fixLinksInDir parcourt les sous-dossiers et préserve mailto', async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), 'docs-cov-links-'));
    const sub = path.join(dir, 'nested');
    await mkdir(sub);
    const file = path.join(sub, 'page.md');
    await writeFile(file, '[Mail](mailto:a@b.fr)\n', 'utf8');
    const config = {
      navigation: {
        generatedPages: [{ link: '/generated/architecture', file: 'architecture.md' }],
        staticPages: [],
        categories: [],
        home: { link: '/', text: 'Home' },
      },
      chapters: [],
      linkRewrites: {},
    };
    try {
      await fixLinksInDir(dir, config);
      const content = await readFile(file, 'utf8');
      expect(content).toContain('mailto:a@b.fr');
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it('writeGeneratedDoc sans baseDir écrit directement', async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), 'docs-writer-raw-'));
    const target = path.join(dir, 'raw.md');
    try {
      await writeGeneratedDoc(target, '# OK\n');
      expect(await readFile(target, 'utf8')).toContain('# OK');
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it('buildLocalFileTree s’arrête à maxFiles', async () => {
    const tree = await buildLocalFileTree(repoRoot, 2);
    const files = tree.split('\n').filter((l) => l && !l.endsWith('/'));
    expect(files.length).toBeLessThanOrEqual(2);
  });

  it('fetchGithubTree sans token ni readme ok', async () => {
    globalThis.fetch = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ default_branch: 'main', description: '' }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ tree: [{ type: 'blob', path: 'README.md' }] }),
      })
      .mockResolvedValueOnce({ ok: false, status: 404 });

    const data = await fetchGithubTree({ owner: 'x', repo: 'y' });
    expect(data.readme).toBe('');
  });
});


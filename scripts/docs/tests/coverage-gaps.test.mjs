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
import { buildLocalFileTree, fetchGithubTree, readReadme } from '../src/services/github.mjs';

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

  it('buildLocalFileTree ignore dotfiles sauf .env.example', async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), 'gh-tree-'));
    await mkdir(path.join(dir, '.secret'));
    await writeFile(path.join(dir, '.env.example'), 'x=1\n', 'utf8');
    await writeFile(path.join(dir, 'README.md'), '# Hi\n', 'utf8');
    try {
      const tree = await buildLocalFileTree(dir, 50);
      expect(tree).toContain('README.md');
      expect(tree).not.toContain('.secret');
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it('links — alias déjà présent et titre existant', () => {
    const maps = buildDocTitleMaps({
      navigation: { generatedPages: [], staticPages: [] },
      chapters: [],
      defaultSeeAlso: [],
      linkLabelAliases: [{ label: 'Dup', href: '/guide/x', title: 'T1' }],
    });
    maps.labelToHref.set('dup', '/guide/other');
    const withTitle = buildDocTitleMaps({
      navigation: { generatedPages: [], staticPages: [] },
      chapters: [],
      defaultSeeAlso: [],
      linkLabelAliases: [{ label: 'X', href: '/guide/y', title: 'Override' }],
    });
    expect(withTitle.pathToTitle.get('/guide/y')).toBe('Override');
    expect(maps.labelToHref.get('dup')).toBe('/guide/other');
  });

  it('links — chemins relatifs, rewrites et voir aussi', () => {
    const valid = new Set(['/generated/architecture', '/guide/start']);
    const rewrites = { '/old': '/generated/architecture' };
    expect(extractInternalDocPath('guide/start')).toBe('/guide/start');
    expect(normalizeMarkdownLink('X', 'https://x.com', valid, rewrites)).toBe('X');
    expect(
      normalizeMarkdownLink('Y', '/old', valid, rewrites),
    ).toBe('[Y](/generated/architecture)');

    const maps = buildDocTitleMaps({
      navigation: {
        generatedPages: [{ link: '/generated/architecture', title: 'Arch' }],
        staticPages: [{ link: '/guide/start', title: 'Start' }],
      },
      chapters: [],
      defaultSeeAlso: [{ label: 'Arch', href: '/generated/architecture' }],
      linkLabelAliases: [],
    });
    const out = repairVoirAussiSection(
      `## Voir aussi
- [Broken](https://evil.com/x)
- /generated/unknown
`,
      valid,
      rewrites,
      maps,
    );
    expect(out).toContain('[Arch](/generated/architecture)');
  });

  it('resolveVoirAussi — titre dérivé du chemin si absent du map', () => {
    const valid = new Set(['/generated/my-page']);
    const maps = buildDocTitleMaps({
      navigation: { generatedPages: [], staticPages: [] },
      chapters: [],
      defaultSeeAlso: [],
      linkLabelAliases: [],
    });
    const out = repairVoirAussiSection(
      `## Voir aussi
/generated/my-page
`,
      valid,
      {},
      maps,
    );
    expect(out).toContain('[my page](/generated/my-page)');
  });

  it('fixLinksInDir réécrit les liens dans le markdown', async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), 'docs-fix-md-'));
    await writeFile(
      path.join(dir, 'page.md'),
      '[Ext](https://example.com/out)\n[Old](/old)\n',
      'utf8',
    );
    const config = {
      navigation: {
        generatedPages: [{ link: '/generated/architecture', file: 'architecture.md' }],
        staticPages: [],
        categories: [],
        home: { link: '/', text: 'Home' },
      },
      chapters: [],
      linkRewrites: { '/old': '/generated/architecture' },
    };
    try {
      await fixLinksInDir(dir, config);
      const content = await readFile(path.join(dir, 'page.md'), 'utf8');
      expect(content).toContain('](/generated/architecture)');
      expect(content).not.toContain('example.com');
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });
});

describe('coverage gaps — generators & services', () => {
  it('api-reference parse routes sans handler et chemin racine', async () => {
    const { parseController } = await import('../src/generators/api-reference.mjs');
    const empty = parseController(
      `@Controller()\nexport class X {\n  @Get()\n  async list() {}\n}\n`,
      '/repo/backend/src/x.controller.ts',
      '/repo',
    );
    expect(empty.routes[0]?.path).toBe('/');

    const content = `
@Controller('items')
export class ItemsController {
  @Get()
  notAsync() {}
}
`;
    const parsed = parseController(content, '/repo/backend/src/items.controller.ts', '/repo');
    expect(parsed.routes).toHaveLength(0);
  });

  it('api-reference ignore les contrôleurs sans routes', async () => {
    const { generateApiReference } = await import('../src/generators/api-reference.mjs');
    const dir = await mkdtemp(path.join(os.tmpdir(), 'api-ref-empty-'));
    const backendSrc = path.join(dir, 'src');
    await mkdir(path.join(backendSrc, 'empty'), { recursive: true });
    await writeFile(
      path.join(backendSrc, 'empty', 'empty.controller.ts'),
      `@Controller('empty')\nexport class EmptyController {}\n`,
      'utf8',
    );
    const config = {
      apiReference: { websocketEvents: [{ event: 'ping', description: 'Ping' }] },
    };
    const generatedDir = path.join(dir, 'generated');
    await mkdir(generatedDir, { recursive: true });
    const paths = {
      backendSrc,
      repoRoot: dir,
      generatedDir,
      generatedFile: (name) => path.join(generatedDir, name),
    };
    try {
      await generateApiReference(config, paths);
      const md = await readFile(paths.generatedFile('api-reference.md'), 'utf8');
      expect(md).toContain('WebSocket');
      expect(md).not.toContain('empty.controller.ts');
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it('links — open-task, relatifs, rewrites et voir aussi par défaut', async () => {
    expect(
      extractInternalDocPath('https://pages.github.io/open-task/generated/architecture'),
    ).toBe('/generated/architecture');
    expect(normalizeMarkdownLink('L', 'guide/start', new Set(['/guide/start']), {})).toBe(
      '[L](/guide/start)',
    );

    const valid = new Set(['/generated/architecture']);
    const maps = buildDocTitleMaps({
      navigation: { generatedPages: [], staticPages: [] },
      chapters: [],
      defaultSeeAlso: [{ label: 'Arch', href: '/generated/architecture' }],
      linkLabelAliases: [],
    });
    const emptySection = repairVoirAussiSection('## Voir aussi\n\n', valid, {}, maps);
    expect(emptySection).toContain('[Arch](/generated/architecture)');

    const dir = await mkdtemp(path.join(os.tmpdir(), 'docs-rewrites-'));
    await writeFile(path.join(dir, 'x.md'), '[Bad](/missing)\n', 'utf8');
    const config = {
      navigation: {
        generatedPages: [{ link: '/generated/architecture', file: 'architecture.md' }],
        staticPages: [],
        categories: [],
        home: { link: '/', text: 'Home' },
      },
      chapters: [],
      linkRewrites: { '/old': '/generated/architecture' },
    };
    try {
      await fixLinksInDir(dir, config);
      expect(await readFile(path.join(dir, 'x.md'), 'utf8')).toContain('Bad');
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it('github — maxFiles, extensions ignorées et README distant', async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), 'gh-local-'));
    await mkdir(path.join(dir, 'sub'), { recursive: true });
    await writeFile(path.join(dir, 'sub', 'a.ts'), 'export {}\n', 'utf8');
    await writeFile(path.join(dir, 'skip.png'), 'bin', 'utf8');
    await writeFile(path.join(dir, 'readme.md'), '# Local\n', 'utf8');
    const tree = await buildLocalFileTree(dir, 1);
    expect(tree.split('\n').filter(Boolean).length).toBeLessThanOrEqual(2);
    expect(tree).not.toContain('skip.png');
    await expect(readReadme(dir)).resolves.toContain('Local');

    globalThis.fetch = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ default_branch: 'main', description: 'Demo' }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ tree: [{ type: 'blob', path: 'README.md' }] }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          content: Buffer.from('# Remote').toString('base64'),
        }),
      });
    const remote = await fetchGithubTree({ owner: 'acme', repo: 'open-task', token: 'tok' });
    expect(remote.readme).toContain('Remote');
    expect(remote.description).toBe('Demo');
  });

  it('generateArchitecture en local sans GitHub Actions', async () => {
    vi.resetModules();
    const chatCompletion = vi.fn()
      .mockResolvedValueOnce('<explanation>OK</explanation>')
      .mockResolvedValueOnce('```mermaid\nflowchart LR\n  A --> B\n```');
    vi.doMock('../src/services/mistral.mjs', () => ({
      chatCompletion,
      extractMermaidBlock: (t) => t.match(/```mermaid\n([\s\S]*?)```/)?.[1]?.trim() ?? null,
      extractXmlTag: (t, tag) => t.match(new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`))?.[1]?.trim() ?? t,
      resolveMistralCredentials: () => ({ apiKey: 'k', model: 'mistral-small-latest' }),
      resolveMistralRequestOptions: () => ({ retry: { maxAttempts: 1 }, requestDelayMs: 0 }),
    }));
    const { generateArchitecture } = await import('../src/generators/architecture.mjs');
    const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
    const config = await (await import('../src/core/config.mjs')).loadConfig();
    const paths = (await import('../src/core/paths.mjs')).createPaths(repoRoot, config);
    const outDir = await mkdtemp(path.join(os.tmpdir(), 'arch-gen-'));
    paths.generatedDir = outDir;
    paths.generatedFile = (name) => path.join(outDir, name);
    try {
      await generateArchitecture(config, paths, { MISTRAL_API_KEY: 'test-key' });
      const md = await readFile(paths.generatedFile('architecture.md'), 'utf8');
      expect(md).toContain('flowchart LR');
    } finally {
      await rm(outDir, { recursive: true, force: true });
      vi.doUnmock('../src/services/mistral.mjs');
      vi.resetModules();
    }
  });

  it('generateChapters applique le cooldown à partir du 2e chapitre', async () => {
    vi.resetModules();
    const chatCompletion = vi.fn().mockResolvedValue('# Chapitre\n');
    vi.doMock('../src/services/mistral.mjs', () => ({
      chatCompletion,
      resolveMistralCredentials: () => ({ apiKey: 'k', model: 'mistral-small-latest' }),
      resolveMistralRequestOptions: () => ({ retry: { maxAttempts: 1 }, requestDelayMs: 99 }),
    }));
    const { generateChapters } = await import('../src/generators/chapters.mjs');
    const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
    const config = await (await import('../src/core/config.mjs')).loadConfig();
    config.chapters = config.chapters.slice(0, 2);
    const paths = (await import('../src/core/paths.mjs')).createPaths(repoRoot, config);
    const outDir = await mkdtemp(path.join(os.tmpdir(), 'chapters-gen-'));
    paths.generatedDir = outDir;
    paths.chapterFile = (p) => path.join(outDir, 'modules', `${p}.md`);
    try {
      await generateChapters(config, paths, { MISTRAL_API_KEY: 'test-key' });
      expect(chatCompletion).toHaveBeenCalled();
      const second = chatCompletion.mock.calls[1]?.[0];
      expect(second?.cooldownBeforeMs).toBe(99);
    } finally {
      await rm(outDir, { recursive: true, force: true });
      vi.doUnmock('../src/services/mistral.mjs');
      vi.resetModules();
    }
  });

});


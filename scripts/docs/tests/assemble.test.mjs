import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const vitestDir = path.join(repoRoot, '.vitest-docs-assemble');

let localPaths;

vi.mock('../src/core/paths.mjs', () => ({
  createPaths: vi.fn(() => localPaths),
}));

const { assembleDocs, runAssemble } = await import('../src/generators/assemble.mjs');
const { loadConfig } = await import('../src/core/config.mjs');

describe('assembleDocs', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(async () => {
    await rm(vitestDir, { recursive: true, force: true });
  });

  it('fixes links and writes sidebar manifest', async () => {
    const tmp = vitestDir;
    const generatedDir = path.join(tmp, 'docs/generated');
    const docsDir = path.join(tmp, 'docs');
    await mkdir(generatedDir, { recursive: true });
    await mkdir(path.join(docsDir, '.vitepress'), { recursive: true });
    await writeFile(
      path.join(generatedDir, 'architecture.md'),
      [
        '## Voir aussi',
        '- [Bad](https://example.com/generated/architecture)',
        '',
        '```mermaid',
        'flowchart LR',
        '  A[API: REST]',
        '```',
        '',
      ].join('\n'),
      'utf8',
    );
    await writeFile(path.join(generatedDir, 'database.md'), '# Base\n', 'utf8');

    localPaths = {
      generatedDir,
      docsDir,
      sidebarFile: path.join(docsDir, '.vitepress/sidebar.generated.json'),
    };

    const config = await loadConfig();

    const diagrams = await import('../src/services/diagrams.mjs');
    const injectSpy = vi.spyOn(diagrams, 'injectDiagramsIntoDir');
    const log = vi.spyOn(console, 'log').mockImplementation(() => {});
    await assembleDocs(repoRoot, config);
    expect(injectSpy).toHaveBeenCalledWith(
      generatedDir,
      config.diagrams,
      readFile,
      writeFile,
    );
    injectSpy.mockRestore();
    const md = await readFile(path.join(generatedDir, 'architecture.md'), 'utf8');
    expect(md).toContain('](/generated/architecture)');
    expect(md).toContain('A["API: REST"]');
    const sidebar = await readFile(localPaths.sidebarFile, 'utf8');
    expect(sidebar).toContain('"text"');
    expect(log).toHaveBeenCalledWith(expect.stringContaining('[assemble] Mermaid corrigé'));
    log.mockRestore();
  });

  it('propage les erreurs autres que ENOENT', async () => {
    vi.resetModules();
    vi.doMock('../src/services/links.mjs', () => ({
      fixLinksInDir: vi.fn(async () => {
        const err = new Error('permission');
        err.code = 'EACCES';
        throw err;
      }),
    }));
    vi.doMock('../src/services/diagrams.mjs', () => ({
      injectDiagramsIntoDir: vi.fn(async () => {}),
    }));
    const { assembleDocs: assembleWithMock } = await import('../src/generators/assemble.mjs');
    const tmp = path.join(vitestDir, 'eacces');
    const generatedDir = path.join(tmp, 'docs/generated');
    const docsDir = path.join(tmp, 'docs');
    const docsGenerated = path.join(docsDir, 'generated');
    await mkdir(generatedDir, { recursive: true });
    await mkdir(docsGenerated, { recursive: true });
    await mkdir(path.join(docsDir, '.vitepress'), { recursive: true });
    await writeFile(path.join(docsGenerated, 'architecture.md'), '# Arch\n', 'utf8');
    await writeFile(path.join(docsGenerated, 'database.md'), '# Base\n', 'utf8');
    localPaths = {
      generatedDir,
      docsDir,
      sidebarFile: path.join(docsDir, '.vitepress/sidebar.generated.json'),
    };
    const config = await loadConfig();
    await expect(assembleWithMock(repoRoot, config)).rejects.toMatchObject({ code: 'EACCES' });
    vi.doUnmock('../src/services/links.mjs');
    vi.doUnmock('../src/services/diagrams.mjs');
  });

  it('ignore ENOENT quand injectDiagrams échoue', async () => {
    const tmp = path.join(vitestDir, 'inject-enoent');
    const generatedDir = path.join(tmp, 'docs/generated');
    const docsDir = path.join(tmp, 'docs');
    const docsGenerated = path.join(docsDir, 'generated');
    await mkdir(generatedDir, { recursive: true });
    await mkdir(docsGenerated, { recursive: true });
    await mkdir(path.join(docsDir, '.vitepress'), { recursive: true });
    await writeFile(path.join(docsGenerated, 'architecture.md'), '# Arch\n', 'utf8');
    await writeFile(path.join(docsGenerated, 'database.md'), '# Base\n', 'utf8');
    localPaths = {
      generatedDir,
      docsDir,
      sidebarFile: path.join(docsDir, '.vitepress/sidebar.generated.json'),
    };
    const diagrams = await import('../src/services/diagrams.mjs');
    vi.spyOn(diagrams, 'injectDiagramsIntoDir').mockRejectedValueOnce(
      Object.assign(new Error('missing diagrams'), { code: 'ENOENT' }),
    );
    const config = await loadConfig();
    await expect(assembleDocs(repoRoot, config)).resolves.toBeUndefined();
    vi.restoreAllMocks();
  });

  it('ignore ENOENT when generated dir is missing', async () => {
    const tmp = path.join(vitestDir, 'empty');
    const docsDir = path.join(tmp, 'docs');
    const docsGenerated = path.join(docsDir, 'generated');
    await mkdir(path.join(docsDir, '.vitepress'), { recursive: true });
    await mkdir(docsGenerated, { recursive: true });
    await writeFile(path.join(docsGenerated, 'architecture.md'), '# Arch\n', 'utf8');
    await writeFile(path.join(docsGenerated, 'database.md'), '# Base\n', 'utf8');
    localPaths = {
      generatedDir: path.join(tmp, 'missing-generated'),
      docsDir,
      sidebarFile: path.join(docsDir, '.vitepress/sidebar.generated.json'),
    };
    const config = await loadConfig();
    await expect(assembleDocs(repoRoot, config)).resolves.toBeUndefined();
    const sidebar = await readFile(localPaths.sidebarFile, 'utf8');
    expect(sidebar).toContain('"text"');
  });

  it('runAssemble loads config and assembles', async () => {
    const tmp = path.join(vitestDir, 'run');
    const generatedDir = path.join(tmp, 'docs/generated');
    const docsDir = path.join(tmp, 'docs');
    const docsGenerated = path.join(docsDir, 'generated');
    await mkdir(generatedDir, { recursive: true });
    await mkdir(path.join(docsDir, '.vitepress'), { recursive: true });
    await mkdir(docsGenerated, { recursive: true });
    await writeFile(path.join(generatedDir, 'architecture.md'), '# Arch\n', 'utf8');
    await writeFile(path.join(docsGenerated, 'architecture.md'), '# Arch\n', 'utf8');
    await writeFile(path.join(docsGenerated, 'database.md'), '# Base\n', 'utf8');

    localPaths = {
      generatedDir,
      docsDir,
      sidebarFile: path.join(docsDir, '.vitepress/sidebar.generated.json'),
    };

    const log = vi.spyOn(console, 'log').mockImplementation(() => {});
    await runAssemble(repoRoot);
    expect(log).toHaveBeenCalledWith('[assemble] Navigation mise à jour');
    log.mockRestore();
  });
});

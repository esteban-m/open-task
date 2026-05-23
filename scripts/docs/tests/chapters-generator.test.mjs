import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { loadConfig, resetConfigCache } from '../src/core/config.mjs';

vi.mock('../src/services/sources.mjs', () => ({
  bundleSources: vi.fn(async () => 'export const x = 1;\n'),
}));

vi.mock('../src/services/mistral.mjs', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    chatCompletion: vi.fn().mockResolvedValue(
      '## Objectif du projet\n\nContenu généré.\n\n## Voir aussi\n- [Architecture](/generated/architecture)\n',
    ),
  };
});

const { generateChapters } = await import('../src/generators/chapters.mjs');

describe('generateChapters (Mistral)', () => {
  beforeEach(() => {
    resetConfigCache();
    vi.clearAllMocks();
  });

  it('génère un chapitre avec MISTRAL_API_KEY', async () => {
    const config = await loadConfig();
    config.chapters = [config.chapters[0]];

    const tmp = await mkdtemp(path.join(os.tmpdir(), 'chapters-gen-'));
    const generatedDir = path.join(tmp, 'generated');
    await mkdir(generatedDir, { recursive: true });
    await writeFile(path.join(generatedDir, 'architecture.md'), '# Arch\n', 'utf8');

    const paths = {
      repoRoot: process.cwd(),
      generatedDir,
      generatedFile: (name) => path.join(generatedDir, name),
      chapterFile: (chapterPath) => path.join(generatedDir, `${chapterPath}.md`),
      manifestFile: path.join(generatedDir, '.doc-manifest.json'),
    };

    await generateChapters(config, paths, { MISTRAL_API_KEY: 'test-key' });

    const md = await readFile(path.join(generatedDir, 'guide/introduction.md'), 'utf8');
    expect(md).toContain('Contenu généré');

    await rm(tmp, { recursive: true, force: true });
  });

  it('exige MISTRAL_API_KEY', async () => {
    const config = await loadConfig();
    await expect(
      generateChapters(
        config,
        { repoRoot: '.', generatedDir: '/tmp/g', generatedFile: (n) => `/tmp/g/${n}`, chapterFile: (p) => `/tmp/g/${p}.md` },
        {},
      ),
    ).rejects.toThrow('MISTRAL_API_KEY manquant');
  });
});

import { mkdtemp, mkdir, readFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { loadConfig, resetConfigCache } from '../src/core/config.mjs';

vi.mock('../src/services/github.mjs', () => ({
  buildLocalFileTree: vi.fn(async () => 'backend/\nfrontend/'),
  readReadme: vi.fn(async () => '# Open-Task'),
  fetchGithubTree: vi.fn(),
}));

vi.mock('../src/services/mistral.mjs', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    chatCompletion: vi.fn()
      .mockResolvedValueOnce('<explanation>Vue synthétique</explanation>')
      .mockResolvedValueOnce('```mermaid\nflowchart LR\n  API --> DB\n```'),
  };
});

const { generateArchitecture } = await import('../src/generators/architecture.mjs');

describe('generateArchitecture (Mistral)', () => {
  beforeEach(() => {
    resetConfigCache();
    vi.clearAllMocks();
  });

  it('génère architecture.md avec MISTRAL_API_KEY', async () => {
    const config = await loadConfig();
    const tmp = await mkdtemp(path.join(os.tmpdir(), 'arch-gen-'));
    const generatedDir = path.join(tmp, 'generated');
    await mkdir(generatedDir, { recursive: true });

    const paths = {
      repoRoot: process.cwd(),
      generatedDir,
      generatedFile: (name) => path.join(generatedDir, name),
    };

    await generateArchitecture(config, paths, {
      MISTRAL_API_KEY: 'test-key',
      GITHUB_REPOSITORY: 'esteban-m/open-task',
    });

    const md = await readFile(path.join(generatedDir, 'architecture.md'), 'utf8');
    expect(md).toContain('Mistral AI');
    expect(md).toContain('Vue synthétique');
    expect(md).toContain('flowchart LR');

    await rm(tmp, { recursive: true, force: true });
  });

  it('exige MISTRAL_API_KEY', async () => {
    const config = await loadConfig();
    await expect(
      generateArchitecture(
        config,
        { repoRoot: '.', generatedDir: '/tmp/g', generatedFile: (n) => `/tmp/g/${n}` },
        {},
      ),
    ).rejects.toThrow('MISTRAL_API_KEY manquant');
  });
});

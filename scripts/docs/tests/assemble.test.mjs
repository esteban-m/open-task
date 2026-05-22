import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');

let localPaths;

vi.mock('../src/core/paths.mjs', () => ({
  createPaths: vi.fn(() => localPaths),
}));

const { assembleDocs } = await import('../src/generators/assemble.mjs');
const { loadConfig } = await import('../src/core/config.mjs');

describe('assembleDocs', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fixes links and writes sidebar manifest', async () => {
    const tmp = await mkdtemp(path.join(os.tmpdir(), 'docs-assemble-'));
    const generatedDir = path.join(tmp, 'docs/generated');
    const docsDir = path.join(tmp, 'docs');
    await mkdir(generatedDir, { recursive: true });
    await mkdir(path.join(docsDir, '.vitepress'), { recursive: true });
    await writeFile(
      path.join(generatedDir, 'architecture.md'),
      '## Voir aussi\n- [Bad](https://example.com/generated/architecture)\n',
      'utf8',
    );
    await writeFile(path.join(generatedDir, 'database.md'), '# Base\n', 'utf8');

    localPaths = {
      generatedDir,
      docsDir,
      sidebarFile: path.join(docsDir, '.vitepress/sidebar.generated.json'),
    };

    const config = await loadConfig();

    try {
      await assembleDocs(repoRoot, config);
      const md = await readFile(path.join(generatedDir, 'architecture.md'), 'utf8');
      expect(md).toContain('](/generated/architecture)');
      const sidebar = await readFile(localPaths.sidebarFile, 'utf8');
      expect(sidebar).toContain('"text"');
    } finally {
      await rm(tmp, { recursive: true, force: true });
    }
  });
});

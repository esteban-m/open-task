import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { fetchGithubTree, readReadme } from '../src/services/github.mjs';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');

describe('fetchGithubTree', () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it('returns tree, readme and description from GitHub API', async () => {
    globalThis.fetch = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ default_branch: 'main', description: 'Task app' }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          tree: [
            { type: 'blob', path: 'backend/src/main.ts' },
            { type: 'blob', path: 'node_modules/pkg/index.js' },
            { type: 'blob', path: 'logo.png' },
            { type: 'tree', path: 'frontend' },
          ],
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ content: Buffer.from('# Readme').toString('base64') }),
      });

    const data = await fetchGithubTree({
      owner: 'esteban-m',
      repo: 'open-task',
      token: 'gh-token',
      maxFiles: 10,
    });

    expect(data.defaultBranch).toBe('main');
    expect(data.description).toBe('Task app');
    expect(data.fileTree).toContain('backend/src/main.ts');
    expect(data.fileTree).not.toContain('node_modules');
    expect(data.fileTree).not.toContain('.png');
    expect(data.readme).toContain('# Readme');
    expect(globalThis.fetch).toHaveBeenCalledTimes(3);
  });

  it('throws when repo or tree request fails', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
    });

    await expect(
      fetchGithubTree({ owner: 'x', repo: 'y', token: 't' }),
    ).rejects.toThrow('GitHub repo: 404');
  });

  it('throws when tree request fails after repo ok', async () => {
    globalThis.fetch = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ default_branch: 'main' }),
      })
      .mockResolvedValueOnce({ ok: false, status: 500 });

    await expect(
      fetchGithubTree({ owner: 'x', repo: 'y', token: 't' }),
    ).rejects.toThrow('GitHub tree: 500');
  });

  it('ignores readme fetch errors', async () => {
    globalThis.fetch = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ default_branch: 'main', description: null }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ tree: [{ type: 'blob', path: 'README.md' }] }),
      })
      .mockRejectedValueOnce(new Error('network'));

    const data = await fetchGithubTree({ owner: 'x', repo: 'y' });
    expect(data.readme).toBe('');
  });
});

describe('readReadme', () => {
  it('returns empty string when no readme exists', async () => {
    const missing = path.join(repoRoot, '__no_readme_dir__');
    await expect(readReadme(missing)).resolves.toBe('');
  });
});

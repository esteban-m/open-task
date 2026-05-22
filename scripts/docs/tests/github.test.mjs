import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest'

import { buildLocalFileTree, readReadme } from '../src/services/github.mjs'

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');

describe('github helpers', () => {
  it('buildLocalFileTree lists repo files', async () => {
    const tree = await buildLocalFileTree(repoRoot, 50);
    expect(tree.length).toBeGreaterThan(0);
    expect(tree).toMatch(/backend\/|README\.md/);
    expect(tree).not.toContain('node_modules/');
  });

  it('readReadme returns project readme', async () => {
    const readme = await readReadme(repoRoot);
    expect(readme).toContain('Open-Task');
  });
});

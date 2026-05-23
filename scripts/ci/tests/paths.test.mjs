import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

import { packageRoot, repoRoot } from '../src/core/paths.mjs';

describe('paths', () => {
  it('packageRoot et repoRoot pointent vers scripts/ci et la racine', () => {
    const pkg = packageRoot(import.meta.url);
    expect(pkg.endsWith(`${path.sep}scripts${path.sep}ci`)).toBe(true);
    const root = repoRoot(import.meta.url);
    expect(path.basename(root)).not.toBe('ci');
    const cliRoot = repoRoot(new URL('../cli.mjs', import.meta.url).href);
    expect(cliRoot).toBe(root);
  });
});

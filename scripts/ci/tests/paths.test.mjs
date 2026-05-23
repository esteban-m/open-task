import { existsSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

import { packageRoot, repoRoot } from '../src/core/paths.mjs';

describe('paths', () => {
  it('packageRoot et repoRoot pointent vers scripts/ci et la racine', () => {
    const coreUrl = new URL('../src/core/paths.mjs', import.meta.url).href;
    const pkg = packageRoot(coreUrl);
    expect(pkg.endsWith(`${path.sep}scripts${path.sep}ci`)).toBe(true);
    const root = repoRoot(coreUrl);
    expect(existsSync(path.join(root, 'config', 'open-task.e2e.json'))).toBe(true);
    const cliRoot = repoRoot(new URL('../cli.mjs', import.meta.url).href);
    expect(cliRoot).toBe(root);
  });
});

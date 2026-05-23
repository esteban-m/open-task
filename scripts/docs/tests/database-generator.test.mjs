import { mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, it } from 'vitest';

import { loadConfig, resetConfigCache } from '../src/core/config.mjs';
import { createPaths } from '../src/core/paths.mjs';
import { generateDatabase } from '../src/generators/database.mjs';

describe('generateDatabase', () => {
  afterEach(() => resetConfigCache());

  it('génère database.md avec ERD Mermaid', async () => {
    const repoRoot = fileURLToPath(new URL('../../..', import.meta.url));
    const config = await loadConfig();
    const paths = createPaths(repoRoot, config);
    const outDir = mkdtempSync(path.join(tmpdir(), 'db-gen-'));
    paths.generatedDir = outDir;
    paths.generatedFile = (name) => path.join(outDir, name);

    await generateDatabase(config, paths);

    const md = readFileSync(paths.generatedFile('database.md'), 'utf8');
    expect(md).toContain('erDiagram');
    expect(md).toContain('User');
    expect(md).toContain('Task');
  });
});

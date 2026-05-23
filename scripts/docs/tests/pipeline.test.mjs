import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { resetConfigCache } from '../src/core/config.mjs';

vi.mock('../src/generators/database.mjs', () => ({
  generateDatabase: vi.fn(async () => {
    console.log('[database] mock');
  }),
}));
vi.mock('../src/generators/api-reference.mjs', () => ({
  generateApiReference: vi.fn(async () => {
    console.log('[api] mock');
  }),
}));
vi.mock('../src/generators/architecture.mjs', () => ({
  generateArchitecture: vi.fn(),
}));
vi.mock('../src/generators/chapters.mjs', () => ({
  generateChapters: vi.fn(),
}));
vi.mock('../src/generators/assemble.mjs', () => ({
  assembleDocs: vi.fn(async () => {
    console.log('[assemble] mock');
  }),
}));

const { runPipeline } = await import('../src/pipeline.mjs');
const { generateDatabase } = await import('../src/generators/database.mjs');
const { generateArchitecture } = await import('../src/generators/architecture.mjs');

describe('runPipeline', () => {
  afterEach(() => {
    resetConfigCache();
    vi.clearAllMocks();
  });

  it('exécute les générateurs non-IA et assemble', async () => {
    const repoRoot = mkdtempSync(path.join(tmpdir(), 'docs-pipe-'));
    await runPipeline(repoRoot, { SKIP_AI: 'true' });
    expect(generateDatabase).toHaveBeenCalled();
    expect(generateArchitecture).not.toHaveBeenCalled();
  });
});

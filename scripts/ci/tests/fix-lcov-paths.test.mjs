import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

import { rewriteLcovPaths, runFixLcovPaths } from '../src/reports/fix-lcov-paths.mjs';

describe('rewriteLcovPaths', () => {
  it('préfixe chaque SF sans dupliquer le préfixe', () => {
    const input = [
      'TN:',
      'SF:src/auth/auth.service.ts',
      'DA:1,1',
      'end_of_record',
      'SF:cli.mjs',
      'DA:1,1',
      'end_of_record',
    ].join('\n');

    const out = rewriteLcovPaths(input, 'backend');
    expect(out).toContain('SF:backend/src/auth/auth.service.ts');
    expect(out).toContain('SF:backend/cli.mjs');
    expect(out).not.toContain('SF:backend/backend/');
  });

  it('laisse les chemins déjà normalisés', () => {
    const input = 'SF:frontend/composables/useApi.ts\nDA:1,1\n';
    expect(rewriteLcovPaths(input, 'frontend')).toBe(input);
  });

  it('écrit le fichier via runFixLcovPaths', () => {
    const dir = mkdtempSync(path.join(os.tmpdir(), 'lcov-'));
    const file = path.join(dir, 'lcov.info');
    writeFileSync(file, 'SF:cli.mjs\nDA:1,1\n');
    runFixLcovPaths(['node', 'cli.mjs', 'fix-lcov-paths', file, 'scripts/ci']);
    expect(readFileSync(file, 'utf8')).toContain('SF:scripts/ci/cli.mjs');
  });

  it('rejette les arguments manquants', () => {
    expect(() => runFixLcovPaths(['node', 'cli.mjs', 'fix-lcov-paths'])).toThrow(/Usage/);
  });
});

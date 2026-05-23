import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

import { assertE2eCoverage } from '../src/reports/assert-e2e.mjs';

describe('assert-e2e', () => {
  it('accepte une couverture suffisante', () => {
    const dir = mkdtempSync(path.join(tmpdir(), 'e2e-cov-'));
    const file = path.join(dir, 'summary.json');
    writeFileSync(
      file,
      JSON.stringify({ total: { lines: { total: 100, covered: 60, pct: 60 } } }),
    );
    expect(assertE2eCoverage(file, 55).pct).toBe(60);
  });

  it('rejette une couverture trop basse', () => {
    const dir = mkdtempSync(path.join(tmpdir(), 'e2e-cov-'));
    const file = path.join(dir, 'bad.json');
    writeFileSync(
      file,
      JSON.stringify({ total: { lines: { total: 10, covered: 1, pct: 10 } } }),
    );
    expect(() => assertE2eCoverage(file, 55)).toThrow(/invalide/);
  });
});

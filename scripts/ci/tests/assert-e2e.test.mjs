import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { describe, expect, it, vi } from 'vitest';

import { assertE2eCoverage, runAssertE2e } from '../src/reports/assert-e2e.mjs';

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

  it('signale un fichier summary introuvable', () => {
    expect(() => assertE2eCoverage('/nonexistent/summary.json')).toThrow(/introuvable/);
  });

  it('runAssertE2e log OK sur couverture valide', () => {
    const dir = mkdtempSync(path.join(tmpdir(), 'e2e-run-'));
    const file = path.join(dir, 'summary.json');
    writeFileSync(
      file,
      JSON.stringify({ total: { lines: { total: 10, covered: 8, pct: 80 } } }),
    );
    const log = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    runAssertE2e(['node', 'cli', file]);
    expect(log).toHaveBeenCalledWith(expect.stringContaining('[e2e-coverage] OK'));
    log.mockRestore();
  });
});

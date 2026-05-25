import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
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

  it('rejette un rapport vide (0 lignes)', () => {
    const dir = mkdtempSync(path.join(tmpdir(), 'e2e-empty-'));
    const file = path.join(dir, 'empty.json');
    writeFileSync(file, JSON.stringify({ total: { lines: { total: 0, covered: 0 } } }));
    expect(() => assertE2eCoverage(file, 55)).toThrow(/invalide/);
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

  it('runAssertE2e signale une couverture insuffisante', () => {
    const dir = mkdtempSync(path.join(tmpdir(), 'e2e-run-bad-'));
    const file = path.join(dir, 'summary.json');
    writeFileSync(
      file,
      JSON.stringify({ total: { lines: { total: 10, covered: 1, pct: 10 } } }),
    );
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    expect(() => runAssertE2e(['node', 'cli', file])).toThrow(/invalide/);
    expect(errSpy).toHaveBeenCalledWith(expect.stringContaining('::error::'));
    errSpy.mockRestore();
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

  it('runAssertE2e utilise le chemin par défaut', () => {
    const dir = mkdtempSync(path.join(tmpdir(), 'e2e-default-'));
    const e2eDir = path.join(dir, 'backend', 'coverage-e2e');
    mkdirSync(e2eDir, { recursive: true });
    writeFileSync(
      path.join(e2eDir, 'coverage-summary.json'),
      JSON.stringify({ total: { lines: { total: 10, covered: 8, pct: 80 } } }),
    );
    const cwd = process.cwd();
    try {
      process.chdir(dir);
      const log = vi.spyOn(console, 'log').mockImplementation(() => undefined);
      runAssertE2e(['node', 'cli']);
      expect(log).toHaveBeenCalledWith(expect.stringContaining('[e2e-coverage] OK'));
      log.mockRestore();
    } finally {
      process.chdir(cwd);
    }
  });
});

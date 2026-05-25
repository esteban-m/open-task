import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

import { mergeSummaries, parseMergeArgs, runMergeCoverage } from '../src/reports/merge-summaries.mjs';

describe('merge-summaries', () => {
  it('parseMergeArgs lit -o et les entrées', () => {
    const { inputs, output } = parseMergeArgs([
      'node',
      'cli',
      '-o',
      'out.json',
      'a.json',
      'b.json',
    ]);
    expect(output).toBe('out.json');
    expect(inputs).toEqual(['a.json', 'b.json']);
  });

  it('fusionne deux résumés', () => {
    const dir = mkdtempSync(path.join(tmpdir(), 'cov-'));
    const a = path.join(dir, 'a.json');
    const b = path.join(dir, 'b.json');
    writeFileSync(
      a,
      JSON.stringify({
        'file:a.ts': { lines: { total: 10, covered: 8, skipped: 0, pct: 80 } },
        total: { lines: { total: 10, covered: 8, skipped: 0, pct: 80 } },
      }),
    );
    writeFileSync(
      b,
      JSON.stringify({
        'file:b.ts': { lines: { total: 10, covered: 5, skipped: 0, pct: 50 } },
        total: { lines: { total: 10, covered: 5, skipped: 0, pct: 50 } },
      }),
    );

    const merged = mergeSummaries([a, b]);
    expect(merged.total.lines.total).toBe(20);
    expect(merged.total.lines.covered).toBe(13);
    expect(merged['file:a.ts']).toBeDefined();
    expect(merged['file:b.ts']).toBeDefined();
  });

  it('fusionne deux fichiers avec la même clé', () => {
    const dir = mkdtempSync(path.join(tmpdir(), 'cov-merge-dup-'));
    const a = path.join(dir, 'a.json');
    const b = path.join(dir, 'b.json');
    const entry = { lines: { total: 5, covered: 3, skipped: 0, pct: 60 } };
    const total = { lines: { total: 5, covered: 3, skipped: 0, pct: 60 } };
    writeFileSync(a, JSON.stringify({ 'file/shared.ts': entry, total }));
    writeFileSync(
      b,
      JSON.stringify({
        'file/shared.ts': { lines: { total: 5, covered: 2, skipped: 0, pct: 40 } },
        total: { lines: { total: 5, covered: 2, skipped: 0, pct: 40 } },
      }),
    );
    const merged = mergeSummaries([a, b]);
    expect(merged['file/shared.ts'].lines.covered).toBe(3);
    expect(merged['file/shared.ts'].lines.total).toBe(5);
    expect(merged['file/shared.ts'].lines.pct).toBe(60);
  });

  it('unionMetric borne covered au total', () => {
    const dir = mkdtempSync(path.join(tmpdir(), 'cov-cap-'));
    const a = path.join(dir, 'a.json');
    const b = path.join(dir, 'b.json');
    writeFileSync(
      a,
      JSON.stringify({
        'file/x.ts': { lines: { total: 5, covered: 12, skipped: 0, pct: 240 } },
        total: { lines: { total: 5, covered: 12, skipped: 0, pct: 240 } },
      }),
    );
    writeFileSync(
      b,
      JSON.stringify({
        'file/x.ts': { lines: { total: 8, covered: 3, skipped: 0, pct: 37.5 } },
        total: { lines: { total: 8, covered: 3, skipped: 0, pct: 37.5 } },
      }),
    );
    const merged = mergeSummaries([a, b]);
    expect(merged['file/x.ts'].lines.total).toBe(8);
    expect(merged['file/x.ts'].lines.covered).toBe(8);
  });

  it('unionne unit + e2e sans double-compter les lignes', () => {
    const dir = mkdtempSync(path.join(tmpdir(), 'cov-unit-e2e-'));
    const unit = path.join(dir, 'unit.json');
    const e2e = path.join(dir, 'e2e.json');
    const entry = { lines: { total: 10, covered: 10, skipped: 0, pct: 100 } };
    writeFileSync(unit, JSON.stringify({ 'backend/src/auth.service.ts': entry, total: entry }));
    writeFileSync(
      e2e,
      JSON.stringify({
        'backend/src/auth.service.ts': { lines: { total: 10, covered: 4, skipped: 0, pct: 40 } },
        total: { lines: { total: 10, covered: 4, skipped: 0, pct: 40 } },
      }),
    );
    const merged = mergeSummaries([unit, e2e]);
    expect(merged['backend/src/auth.service.ts'].lines.pct).toBe(100);
    expect(merged.total.lines.total).toBe(10);
    expect(merged.total.lines.covered).toBe(10);
  });

  it('parseMergeArgs exige des entrées', () => {
    expect(() => parseMergeArgs(['node', 'cli'])).toThrow(/Usage/);
  });

  it('runMergeCoverage écrit le fichier de sortie', () => {
    const dir = mkdtempSync(path.join(tmpdir(), 'cov-merge-'));
    const a = path.join(dir, 'a.json');
    const out = path.join(dir, 'merged.json');
    writeFileSync(
      a,
      JSON.stringify({
        'file:a.ts': { lines: { total: 2, covered: 2, skipped: 0, pct: 100 } },
        total: { lines: { total: 2, covered: 2, skipped: 0, pct: 100 } },
      }),
    );
    runMergeCoverage(['node', 'cli', '-o', out, a]);
    const merged = JSON.parse(readFileSync(out, 'utf8'));
    expect(merged.total.lines.covered).toBe(2);
  });
});

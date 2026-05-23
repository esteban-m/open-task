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
    expect(merged['file/shared.ts'].lines.covered).toBe(5);
    expect(merged['file/shared.ts'].lines.total).toBe(10);
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

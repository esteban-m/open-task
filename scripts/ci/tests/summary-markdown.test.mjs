import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

import { badgeColor, buildCoverageFragments } from '../src/reports/summary-markdown.mjs';

describe('summary-markdown', () => {
  it('badgeColor selon seuils', () => {
    expect(badgeColor(90, 65, 85)).toBe('brightgreen');
    expect(badgeColor(70, 65, 85)).toBe('yellow');
    expect(badgeColor(10, 65, 85)).toBe('red');
  });

  it('écrit les fragments markdown', () => {
    const dir = mkdtempSync(path.join(tmpdir(), 'cov-md-'));
    const summary = path.join(dir, 's.json');
    writeFileSync(
      summary,
      JSON.stringify({ total: { lines: { total: 4, covered: 3, pct: 75 } } }),
    );
    const outDir = path.join(dir, 'frag');
    const { linesPath, pct } = buildCoverageFragments(summary, {
      outDir,
      prefix: 'test',
      warning: 65,
      good: 85,
    });
    expect(pct).toBe(75);
    expect(readFileSync(linesPath, 'utf8')).toContain('75%');
  });
});

import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

import { detailTable, parseWikiPagesArgs, relSourcePath } from '../src/reports/wiki-pages.mjs';

describe('wiki-pages', () => {
  it('parseWikiPagesArgs lit les packages', () => {
    const opts = parseWikiPagesArgs([
      'node',
      'cli',
      '--out-dir',
      'out',
      '--sha',
      'abc',
      '--package',
      'slug:Titre:summary.json:lines.md:badge.md',
    ]);
    expect(opts.outDir).toBe('out');
    expect(opts.packages).toHaveLength(1);
    expect(opts.packages[0].slug).toBe('slug');
  });

  it('detailTable trie par couverture croissante', () => {
    const dir = mkdtempSync(path.join(tmpdir(), 'wiki-'));
    const summary = path.join(dir, 's.json');
    writeFileSync(
      summary,
      JSON.stringify({
        '/repo/a.ts': { lines: { total: 10, covered: 9, pct: 90 } },
        '/repo/b.ts': { lines: { total: 10, covered: 1, pct: 10 } },
      }),
    );
    const table = detailTable(summary, '/repo');
    expect(table).toContain('b.ts');
    expect(table.indexOf('b.ts')).toBeLessThan(table.indexOf('a.ts'));
  });

  it('relSourcePath extrait le chemin relatif', () => {
    expect(relSourcePath('/Users/me/open-task/backend/src/a.ts', '/Users/me/open-task')).toBe(
      'backend/src/a.ts',
    );
  });
});

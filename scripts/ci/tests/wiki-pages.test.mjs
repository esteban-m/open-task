import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

import {
  detailTable,
  parseWikiPagesArgs,
  relSourcePath,
  runWikiPages,
} from '../src/reports/wiki-pages.mjs';

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
    expect(relSourcePath('/github/workspace/open-task/scripts/ci/cli.mjs', '/github/workspace')).toBe(
      'open-task/scripts/ci/cli.mjs',
    );
    expect(relSourcePath('/tmp/autre/dossier/file.ts', '/tmp/autre')).toBe('dossier/file.ts');
    expect(relSourcePath('C:\\\\only\\\\name.ts', 'C:\\\\other')).toBe('name.ts');
  });

  it('detailTable sans entrées fichier retourne un placeholder', () => {
    const dir = mkdtempSync(path.join(tmpdir(), 'wiki-empty-'));
    const summary = path.join(dir, 'empty.json');
    writeFileSync(summary, JSON.stringify({ total: { lines: { total: 0, covered: 0, pct: 0 } } }));
    expect(detailTable(summary, dir)).toContain('Aucun fichier');
  });

  it('detailTable utilise 0 si covered/total absents', () => {
    const dir = mkdtempSync(path.join(tmpdir(), 'wiki-nulls-'));
    const summary = path.join(dir, 's.json');
    writeFileSync(
      summary,
      JSON.stringify({
        '/repo/a.ts': { lines: { pct: 33 } },
      }),
    );
    const table = detailTable(summary, '/repo');
    expect(table).toContain('0/0');
    expect(table).toContain('33%');
  });

  it('detailTable tolère des métriques partielles', () => {
    const dir = mkdtempSync(path.join(tmpdir(), 'wiki-partial-'));
    const summary = path.join(dir, 's.json');
    writeFileSync(
      summary,
      JSON.stringify({
        '/repo/a.ts': { lines: { total: 5, covered: 2 } },
      }),
    );
    const table = detailTable(summary, '/repo');
    expect(table).toContain('2/5');
    expect(table).toContain('a.ts');
  });

  it('detailTable ignore les entrées sans métrique lines', () => {
    const dir = mkdtempSync(path.join(tmpdir(), 'wiki-nolines-'));
    const summary = path.join(dir, 's.json');
    writeFileSync(
      summary,
      JSON.stringify({
        '/repo/a.ts': { branches: { total: 1, covered: 1, pct: 100 } },
        '/repo/b.ts': { lines: { total: 2, covered: 1, pct: 50 } },
      }),
    );
    const table = detailTable(summary, '/repo');
    expect(table).toContain('b.ts');
    expect(table).not.toContain('a.ts');
  });

  it('parseWikiPagesArgs exige au moins un package', () => {
    expect(() => parseWikiPagesArgs(['node', 'cli', '--out-dir', 'out'])).toThrow(/Usage/);
  });

  it('runWikiPages écrit index et pages paquet', () => {
    const dir = mkdtempSync(path.join(tmpdir(), 'wiki-run-'));
    const summary = path.join(dir, 'summary.json');
    const lines = path.join(dir, 'lines.md');
    const badge = path.join(dir, 'badge.md');
    writeFileSync(summary, JSON.stringify({ total: { lines: { total: 1, covered: 1, pct: 100 } } }));
    writeFileSync(lines, '| Lignes | 1/1 | 100% |');
    writeFileSync(badge, '![lines](badge)');

    const outDir = path.join(dir, 'wiki-out');
    const repoRoot = path.join(dir, 'repo');
    runWikiPages([
      'node',
      'cli',
      '--out-dir',
      outDir,
      '--sha',
      'abc123',
      '--run-url',
      'https://example.com/run/1',
      '--repo-root',
      repoRoot,
      '--package',
      `Couverture-des-tests:Vue d'ensemble:${summary}:${lines}:${badge}`,
      '--package',
      `Couverture-CI:Scripts CI:${summary}:/missing/lines.md:${badge}`,
    ]);

    expect(readFileSync(path.join(outDir, 'Couverture-des-tests.md'), 'utf8')).toContain('Vue d’ensemble');
    expect(readFileSync(path.join(outDir, 'Couverture-CI.md'), 'utf8')).toContain('Scripts CI');
    expect(readFileSync(path.join(outDir, 'Couverture-CI.md'), 'utf8')).toContain('Indisponible');
  });

  it('index wiki sans paquet Couverture-des-tests utilise le premier package', () => {
    const dir = mkdtempSync(path.join(tmpdir(), 'wiki-first-pkg-'));
    const summary = path.join(dir, 'summary.json');
    const lines = path.join(dir, 'lines.md');
    const badge = path.join(dir, 'badge.md');
    writeFileSync(summary, JSON.stringify({ total: { lines: { total: 1, covered: 1, pct: 100 } } }));
    writeFileSync(lines, 'lines');
    writeFileSync(badge, 'badge');
    const outDir = path.join(dir, 'wiki-out');
    runWikiPages([
      'node',
      'cli',
      '--out-dir',
      outDir,
      '--sha',
      'sha2',
      '--repo-root',
      dir,
      '--package',
      `Couverture-CI:Scripts CI:${summary}:${lines}:${badge}`,
    ]);
    const index = readFileSync(path.join(outDir, 'Couverture-CI.md'), 'utf8');
    expect(index).toContain('Scripts CI');
    expect(index).toContain('lines');
  });

  it('runWikiPages utilise runUrl par défaut', () => {
    const dir = mkdtempSync(path.join(tmpdir(), 'wiki-default-url-'));
    const summary = path.join(dir, 'summary.json');
    const lines = path.join(dir, 'lines.md');
    const badge = path.join(dir, 'badge.md');
    writeFileSync(summary, JSON.stringify({ total: { lines: { total: 1, covered: 1, pct: 100 } } }));
    writeFileSync(lines, 'lines');
    writeFileSync(badge, 'badge');
    const outDir = path.join(dir, 'wiki-out');
    runWikiPages([
      'node',
      'cli',
      '--out-dir',
      outDir,
      '--sha',
      'sha1',
      '--repo-root',
      dir,
      '--package',
      `Couverture-des-tests:Vue:${summary}:${lines}:${badge}`,
    ]);
    const index = readFileSync(path.join(outDir, 'Couverture-des-tests.md'), 'utf8');
    expect(index).toContain('github.com/esteban-m/open-task/actions');
  });
});

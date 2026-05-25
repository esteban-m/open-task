import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

import {
  badgeColor,
  buildCoverageFragments,
  parseSummaryMarkdownArgs,
  runCoverageMarkdown,
} from '../src/reports/summary-markdown.mjs';

describe('summary-markdown', () => {
  it('badgeColor selon seuils', () => {
    expect(badgeColor(90, 65, 85)).toBe('brightgreen');
    expect(badgeColor(70, 65, 85)).toBe('yellow');
    expect(badgeColor(10, 65, 85)).toBe('red');
  });

  it('parseSummaryMarkdownArgs exige --summary', () => {
    expect(() => parseSummaryMarkdownArgs(['node', 'cli'])).toThrow(/Usage/);
  });

  it('parseSummaryMarkdownArgs lit les options', () => {
    const opts = parseSummaryMarkdownArgs([
      'node',
      'cli',
      '--summary',
      's.json',
      '--out-dir',
      'out',
      '--prefix',
      'ci',
      '--warning',
      '50',
      '--good',
      '80',
    ]);
    expect(opts.summary).toBe('s.json');
    expect(opts.prefix).toBe('ci');
    expect(opts.warning).toBe(50);
    expect(opts.good).toBe(80);
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

  it('buildCoverageFragments rejette un résumé sans total.lines', () => {
    const dir = mkdtempSync(path.join(tmpdir(), 'cov-md-bad-'));
    const summary = path.join(dir, 'bad.json');
    writeFileSync(summary, JSON.stringify({ total: {} }));
    expect(() =>
      buildCoverageFragments(summary, { outDir: dir, prefix: 'x', warning: 50, good: 80 }),
    ).toThrow(/total\.lines/);
  });

  it('badgeColor aux limites exactes', () => {
    expect(badgeColor(85, 65, 85)).toBe('brightgreen');
    expect(badgeColor(65, 65, 85)).toBe('yellow');
  });

  it('buildCoverageFragments utilise 0 si covered/total absents', () => {
    const dir = mkdtempSync(path.join(tmpdir(), 'cov-md-nulls-'));
    const summary = path.join(dir, 'nulls.json');
    writeFileSync(summary, JSON.stringify({ total: { lines: { pct: 42 } } }));
    const { linesPath } = buildCoverageFragments(summary, {
      outDir: dir,
      prefix: 'nulls',
      warning: 50,
      good: 80,
    });
    expect(readFileSync(linesPath, 'utf8')).toContain('0 / 0');
  });

  it('buildCoverageFragments tolère des métriques partielles', () => {
    const dir = mkdtempSync(path.join(tmpdir(), 'cov-md-partial-'));
    const summary = path.join(dir, 'partial.json');
    writeFileSync(summary, JSON.stringify({ total: { lines: { total: 4, covered: 2 } } }));
    const { pct } = buildCoverageFragments(summary, {
      outDir: dir,
      prefix: 'partial',
      warning: 50,
      good: 80,
    });
    expect(pct).toBe(0);
    expect(readFileSync(path.join(dir, 'partial-lines.md'), 'utf8')).toContain('2 / 4');
  });

  it('runCoverageMarkdown génère les fichiers', () => {
    const dir = mkdtempSync(path.join(tmpdir(), 'cov-md-run-'));
    const summary = path.join(dir, 's.json');
    const outDir = path.join(dir, 'frag');
    writeFileSync(
      summary,
      JSON.stringify({ total: { lines: { total: 10, covered: 8, pct: 80 } } }),
    );
    runCoverageMarkdown(['node', 'cli', '--summary', summary, '--out-dir', outDir, '--prefix', 'ci']);
    expect(readFileSync(path.join(outDir, 'ci-lines.md'), 'utf8')).toContain('80%');
  });
});

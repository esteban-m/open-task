import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

export function parseSummaryMarkdownArgs(argv) {
  const opts = {
    summary: '',
    outDir: 'wiki-fragments',
    prefix: 'global',
    warning: 65,
    good: 85,
  };
  for (let i = 2; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--summary' && argv[i + 1]) opts.summary = argv[++i];
    else if (arg === '--out-dir' && argv[i + 1]) opts.outDir = argv[++i];
    else if (arg === '--prefix' && argv[i + 1]) opts.prefix = argv[++i];
    else if (arg === '--warning' && argv[i + 1]) opts.warning = Number(argv[++i]);
    else if (arg === '--good' && argv[i + 1]) opts.good = Number(argv[++i]);
  }
  if (!opts.summary) {
    throw new Error(
      'Usage: coverage-markdown --summary file.json --out-dir dir --prefix name [--warning N] [--good N]',
    );
  }
  return opts;
}

export function badgeColor(pct, warning, good) {
  if (pct >= good) return 'brightgreen';
  if (pct >= warning) return 'yellow';
  return 'red';
}

export function buildCoverageFragments(summaryPath, { outDir, prefix, warning, good }) {
  const data = JSON.parse(readFileSync(summaryPath, 'utf8'));
  const lines = data?.total?.lines;
  if (!lines) {
    throw new Error(`Pas de total.lines dans ${summaryPath}`);
  }

  const pct = lines.pct ?? 0;
  const color = badgeColor(pct, warning, good);
  const covered = lines.covered ?? 0;
  const total = lines.total ?? 0;

  const linesMd = `| Métrique | Couvert / Total | Taux |
| --- | --- | --- |
| **Lignes** | ${covered} / ${total} | **${pct}%** |`;

  const badgeMd = `![lines](https://img.shields.io/badge/lines-${pct}%25-${color})`;

  mkdirSync(outDir, { recursive: true });
  const linesPath = path.join(outDir, `${prefix}-lines.md`);
  const badgePath = path.join(outDir, `${prefix}-badge.md`);
  writeFileSync(linesPath, `${linesMd}\n`, 'utf8');
  writeFileSync(badgePath, `${badgeMd}\n`, 'utf8');

  return { linesPath, badgePath, pct };
}

export function runCoverageMarkdown(argv = process.argv) {
  const opts = parseSummaryMarkdownArgs(argv);
  const { linesPath, pct } = buildCoverageFragments(opts.summary, opts);
  console.log(`[coverage-md] ${linesPath} (${pct}%)`);
}

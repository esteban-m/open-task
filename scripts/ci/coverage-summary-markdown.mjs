#!/usr/bin/env node
/**
 * Remplace autoscatto/action-coverage-summary-markdown en pur Node (même entrée json-summary).
 * Usage: node coverage-summary-markdown.mjs --summary path.json --out-dir dir --prefix backend
 *        --warning 65 --good 85
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

function parseArgs(argv) {
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
    console.error(
      'Usage: coverage-summary-markdown.mjs --summary file.json --out-dir dir --prefix name [--warning N] [--good N]',
    );
    process.exit(1);
  }
  return opts;
}

function badgeColor(pct, warning, good) {
  if (pct >= good) return 'brightgreen';
  if (pct >= warning) return 'yellow';
  return 'red';
}

function encodeBadgeLabel(pct) {
  return `${pct}%25`;
}

const opts = parseArgs(process.argv);
const data = JSON.parse(readFileSync(opts.summary, 'utf8'));
const lines = data?.total?.lines;
if (!lines) {
  console.error(`[coverage-md] Pas de total.lines dans ${opts.summary}`);
  process.exit(1);
}

const pct = lines.pct ?? 0;
const color = badgeColor(pct, opts.warning, opts.good);
const covered = lines.covered ?? 0;
const total = lines.total ?? 0;

const linesMd = `| Métrique | Couvert / Total | Taux |
| --- | --- | --- |
| **Lignes** | ${covered} / ${total} | **${pct}%** |`;

const badgeMd = `![lines](https://img.shields.io/badge/lines-${encodeBadgeLabel(pct)}-${color})`;

mkdirSync(opts.outDir, { recursive: true });
const linesPath = path.join(opts.outDir, `${opts.prefix}-lines.md`);
const badgePath = path.join(opts.outDir, `${opts.prefix}-badge.md`);
writeFileSync(linesPath, `${linesMd}\n`, 'utf8');
writeFileSync(badgePath, `${badgeMd}\n`, 'utf8');
console.log(`[coverage-md] ${linesPath} (${pct}%)`);

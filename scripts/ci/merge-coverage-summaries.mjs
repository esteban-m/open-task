#!/usr/bin/env node
/**
 * Fusionne plusieurs coverage-summary.json (format Istanbul) en un seul fichier.
 * Usage: node scripts/ci/merge-coverage-summaries.mjs -o out.json a.json b.json
 */
import { readFileSync, writeFileSync } from 'node:fs';

const METRICS = ['lines', 'statements', 'functions', 'branches'];

function parseArgs(argv) {
  const inputs = [];
  let output = 'coverage-summary.json';
  for (let i = 2; i < argv.length; i += 1) {
    if (argv[i] === '-o' && argv[i + 1]) {
      output = argv[++i];
    } else {
      inputs.push(argv[i]);
    }
  }
  if (inputs.length === 0) {
    console.error('Usage: merge-coverage-summaries.mjs -o out.json file1.json [file2.json ...]');
    process.exit(1);
  }
  return { inputs, output };
}

function addMetric(a, b) {
  return {
    total: (a?.total ?? 0) + (b?.total ?? 0),
    covered: (a?.covered ?? 0) + (b?.covered ?? 0),
    skipped: (a?.skipped ?? 0) + (b?.skipped ?? 0),
  };
}

function withPct(metric) {
  if (!metric || metric.total === 0) return { ...metric, pct: 0 };
  return {
    ...metric,
    pct: Math.round((metric.covered / metric.total) * 10000) / 100,
  };
}

function mergeSummaries(files) {
  const merged = {};

  for (const file of files) {
    const data = JSON.parse(readFileSync(file, 'utf8'));
    for (const [key, entry] of Object.entries(data)) {
      if (key === 'total') continue;
      if (!merged[key]) {
        merged[key] = structuredClone(entry);
        continue;
      }
      for (const metric of METRICS) {
        merged[key][metric] = withPct(
          addMetric(merged[key][metric], entry[metric]),
        );
      }
    }
  }

  const total = {};
  for (const metric of METRICS) {
    let acc = { total: 0, covered: 0, skipped: 0 };
    for (const entry of Object.values(merged)) {
      acc = addMetric(acc, entry[metric]);
    }
    total[metric] = withPct(acc);
  }
  merged.total = total;
  return merged;
}

const { inputs, output } = parseArgs(process.argv);
writeFileSync(output, `${JSON.stringify(mergeSummaries(inputs), null, 2)}\n`, 'utf8');
console.log(`[merge-coverage] ${inputs.length} fichier(s) → ${output}`);

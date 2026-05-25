#!/usr/bin/env node
import path from 'node:path';
import { pathToFileURL } from 'node:url';

import { runAssertE2e } from './src/reports/assert-e2e.mjs';
import { runMergeCoverage } from './src/reports/merge-summaries.mjs';
import { runMergeLcov } from './src/reports/merge-lcov.mjs';
import { runCoverageMarkdown } from './src/reports/summary-markdown.mjs';
import { runWikiPages } from './src/reports/wiki-pages.mjs';
import { runFixLcovPaths } from './src/reports/fix-lcov-paths.mjs';
import { runVideosToGifs } from './src/playwright/videos-to-gifs.mjs';
import { printStackEnv } from './src/core/e2e-config.mjs';

export function shouldRunCli(argv, metaUrl) {
  const entry = argv[1] ? pathToFileURL(path.resolve(argv[1])).href : '';
  return metaUrl === entry;
}

export async function main(argv = process.argv) {
  const command = argv[2];
  const args = ['node', 'cli.mjs', ...argv.slice(3)];

  switch (command) {
    case 'merge-coverage':
      runMergeCoverage(args);
      break;
    case 'merge-lcov':
      runMergeLcov(args);
      break;
    case 'assert-e2e':
      runAssertE2e(args);
      break;
    case 'coverage-markdown':
      runCoverageMarkdown(args);
      break;
    case 'wiki-pages':
      runWikiPages(args);
      break;
    case 'gifs':
      runVideosToGifs(args);
      break;
    case 'stack-env':
      process.stdout.write(printStackEnv());
      break;
    case 'fix-lcov-paths':
      runFixLcovPaths(args);
      break;
    default:
      console.error(
        `Commande inconnue: ${command ?? '(vide)'}\n`
          + 'Usage: node cli.mjs <merge-coverage|merge-lcov|assert-e2e|coverage-markdown|wiki-pages|gifs|stack-env|fix-lcov-paths> [args…]',
      );
      process.exit(1);
  }
}

export async function runCliEntry(argv, metaUrl) {
  if (!shouldRunCli(argv, metaUrl)) return;
  try {
    await main(argv);
  } catch (err) {
    console.error(err?.stack || err);
    process.exit(1);
  }
}

await runCliEntry(process.argv, import.meta.url);

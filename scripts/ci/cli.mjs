#!/usr/bin/env node
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { runAssertE2e } from './src/reports/assert-e2e.mjs';
import { runMergeCoverage } from './src/reports/merge-summaries.mjs';
import { runCoverageMarkdown } from './src/reports/summary-markdown.mjs';
import { runWikiPages } from './src/reports/wiki-pages.mjs';
import { runVideosToGifs } from './src/playwright/videos-to-gifs.mjs';

export function shouldRunCli(argv, metaUrl) {
  const entry = argv[1] ? pathToFileURL(path.resolve(argv[1])).href : '';
  return metaUrl === entry;
}

export async function main(argv = process.argv) {
  const command = argv[2];

  switch (command) {
    case 'merge-coverage':
      runMergeCoverage(argv);
      break;
    case 'assert-e2e':
      runAssertE2e(argv);
      break;
    case 'coverage-markdown':
      runCoverageMarkdown(argv);
      break;
    case 'wiki-pages':
      runWikiPages(argv);
      break;
    case 'gifs':
      runVideosToGifs(argv);
      break;
    default:
      console.error(
        `Commande inconnue: ${command ?? '(vide)'}\n`
          + 'Usage: node cli.mjs <merge-coverage|assert-e2e|coverage-markdown|wiki-pages|gifs> [args…]',
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

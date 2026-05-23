#!/usr/bin/env node
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { runPipeline } from './src/pipeline.mjs';
import { runAssemble } from './src/generators/assemble.mjs';
import { runValidateMistral } from './src/commands/validate-mistral.mjs';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

export function shouldRunCli(argv, metaUrl) {
  const entry = argv[1] ? pathToFileURL(path.resolve(argv[1])).href : '';
  return metaUrl === entry;
}

export async function main(argv = process.argv) {
  const command = argv[2] ?? 'generate';

  switch (command) {
    case 'generate':
      await runPipeline(REPO_ROOT);
      break;
    case 'assemble':
      await runAssemble(REPO_ROOT);
      break;
    case 'validate-mistral': {
      const model = await runValidateMistral();
      console.log(`[mistral] OK — modèle ${model}`);
      break;
    }
    default:
      console.error(
        `Commande inconnue: ${command}\nUsage: node cli.mjs [generate|assemble|validate-mistral]`,
      );
      process.exit(1);
  }
}

export async function runCliEntry(argv = process.argv, metaUrl = import.meta.url) {
  if (!shouldRunCli(argv, metaUrl)) return;
  await main(argv);
}

export function bootstrapCli(argv = process.argv, metaUrl = import.meta.url) {
  if (!shouldRunCli(argv, metaUrl)) return;
  runCliEntry(argv, metaUrl).catch((err) => {
    console.error(err);
    process.exit(1);
  });
}

bootstrapCli();

#!/usr/bin/env node
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { runPipeline } from './src/pipeline.mjs';
import { runAssemble } from './src/generators/assemble.mjs';
import { runValidateMistral } from './src/commands/validate-mistral.mjs';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

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

const entry = process.argv[1] ? pathToFileURL(path.resolve(process.argv[1])).href : '';
if (import.meta.url === entry) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}

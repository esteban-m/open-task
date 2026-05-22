#!/usr/bin/env node
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { runPipeline } from './src/pipeline.mjs';
import { runAssemble } from './src/generators/assemble.mjs';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const command = process.argv[2] ?? 'generate';

async function main() {
  switch (command) {
    case 'generate':
      await runPipeline(REPO_ROOT);
      break;
    case 'assemble':
      await runAssemble(REPO_ROOT);
      break;
    default:
      console.error(`Commande inconnue: ${command}\nUsage: node cli.mjs [generate|assemble]`);
      process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

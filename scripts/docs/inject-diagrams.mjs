#!/usr/bin/env node
/** Réinjecte les diagrammes versionnés sans regénérer l'IA. */
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { DIAGRAM_INJECTIONS, injectDiagram } from './lib/diagrams.mjs';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const GEN = path.join(REPO_ROOT, 'docs/generated');

for (const spec of DIAGRAM_INJECTIONS) {
  const file = path.join(GEN, `${spec.path}.md`);
  let md = await readFile(file, 'utf8');
  md = md.replace(/\n## Flux d'authentification[\s\S]*?```\n/g, '\n');
  md = md.replace(/\n## Flux temps réel[\s\S]*?```\n/g, '\n');
  md = injectDiagram(md, spec);
  await writeFile(file, md, 'utf8');
  console.log(`[inject] ${spec.path}`);
}

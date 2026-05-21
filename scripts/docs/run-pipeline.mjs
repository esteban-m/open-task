#!/usr/bin/env node
/**
 * Orchestrateur doc-as-code complet.
 */
import { spawn } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const GEN = path.join(REPO_ROOT, 'docs/generated');

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function run(script) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [path.join(__dirname, script)], {
      stdio: 'inherit',
      env: process.env,
    });
    child.on('exit', (code) => (code === 0 ? resolve() : reject(new Error(`${script} exit ${code}`))));
  });
}

const steps = [
  'generate-database.mjs',
  'generate-api-reference.mjs',
];

if (process.env.SKIP_AI !== 'true') {
  steps.push('generate-architecture.mjs', 'generate-structured-docs.mjs');
} else {
  console.log('[pipeline] SKIP_AI=true — génération IA ignorée');
  await mkdir(GEN, { recursive: true });
  await writeFile(
    path.join(GEN, 'architecture.md'),
    `# Architecture\n\n> Génération IA désactivée (SKIP_AI). Configurez \`OPENROUTER_API_KEY\` pour le diagramme GitDiagram.\n`,
    'utf8',
  );
}

for (const step of steps) {
  await run(step);
}

console.log('[pipeline] Terminé — lancer: cd docs && npm run build');

#!/usr/bin/env node
/**
 * Assemble la page wiki Couverture-des-tests.md à partir des sorties de l'action coverage-summary-markdown.
 * Usage: node scripts/ci/build-wiki-coverage-page.mjs --global global.md --backend b.md --frontend f.md --scripts s.md
 */
import { readFileSync, writeFileSync } from 'node:fs';

function parseArgs(argv) {
  const sections = { global: '', backend: '', frontend: '', scripts: '' };
  let output = 'Couverture-des-tests.md';
  let sha = 'unknown';
  let runUrl = '';

  for (let i = 2; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '-o' && argv[i + 1]) output = argv[++i];
    else if (arg === '--sha' && argv[i + 1]) sha = argv[++i];
    else if (arg === '--run-url' && argv[i + 1]) runUrl = argv[++i];
    else if (arg === '--global' && argv[i + 1]) sections.global = argv[++i];
    else if (arg === '--backend' && argv[i + 1]) sections.backend = argv[++i];
    else if (arg === '--frontend' && argv[i + 1]) sections.frontend = argv[++i];
    else if (arg === '--scripts' && argv[i + 1]) sections.scripts = argv[++i];
  }
  return { sections, output, sha, runUrl };
}

const { sections, output, sha, runUrl } = parseArgs(process.argv);
const date = new Date().toISOString().slice(0, 10);

const body = `# Couverture des tests

> Page générée automatiquement par [CI Wiki — couverture](${runUrl || 'https://github.com/esteban-m/open-task/actions'}).  
> Commit : \`${sha}\` — ${date}

## Vue d'ensemble

${readFileSync(sections.global, 'utf8').trim() || '_Indisponible_'}

## Backend (NestJS)

${readFileSync(sections.backend, 'utf8').trim() || '_Indisponible_'}

## Frontend (Nuxt / Vitest)

${readFileSync(sections.frontend, 'utf8').trim() || '_Indisponible_'}

## Scripts (pipeline docs)

${readFileSync(sections.scripts, 'utf8').trim() || '_Indisponible_'}

---

Voir aussi : [Démarrage rapide](Démarrage-rapide), [README du dépôt](https://github.com/esteban-m/open-task).
`;

writeFileSync(output, `${body}\n`, 'utf8');
console.log(`[wiki-coverage] Page écrite : ${output}`);

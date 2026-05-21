#!/usr/bin/env node
/**
 * Diagramme d'architecture principal — inspiré de GitDiagram
 * @see https://github.com/ahmedkhaleel2004/gitdiagram
 */
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { chatCompletion, extractMermaidBlock, extractXmlTag } from './lib/openrouter.mjs';
import { sanitizeMermaid } from './lib/mermaid-sanitize.mjs';
import { buildLocalFileTree, fetchGithubTree, readReadme } from './lib/github-tree.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '../..');
const OUT_DIR = path.join(REPO_ROOT, 'docs/generated');

const SYSTEM_EXPLAIN = `Tu es architecte logiciel. Analyse le dépôt Open-Task (NestJS + Nuxt + PostgreSQL + Socket.io).
Rédige en français une explication structurée (8-12 sections ## courtes) : sous-systèmes, flux de données, frontières, sécurité.
Pas de Mermaid. Pas de JSON. Retourne uniquement :
<explanation>...</explanation>`;

const SYSTEM_MERMAID = `À partir de l'explication et de l'arborescence, produis UN diagramme Mermaid flowchart TB en français.
Inclure : Nuxt, API NestJS, modules auth/lists/tasks, Prisma, PostgreSQL, WebSocket Gateway, JWT.
Max 20 nœuds ; labels courts entre guillemets si espaces. Retourne UNIQUEMENT le bloc \`\`\`mermaid.`;

async function main() {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error('OPENROUTER_API_KEY manquant');

  const model = process.env.OPENROUTER_MODEL ?? 'openai/gpt-4o-mini';
  const [owner, repo] = (process.env.GITHUB_REPOSITORY ?? 'esteban-m/open-task').split('/');

  let fileTree;
  let readme;

  if (process.env.GITHUB_ACTIONS === 'true' && process.env.GITHUB_TOKEN) {
    const data = await fetchGithubTree({
      owner,
      repo,
      token: process.env.GITHUB_TOKEN,
    });
    fileTree = data.fileTree;
    readme = data.readme;
  } else {
    fileTree = await buildLocalFileTree(REPO_ROOT);
    readme = await readReadme(REPO_ROOT);
  }

  const context = `Repository: ${owner}/${repo}\n\n## File tree\n\`\`\`\n${fileTree}\n\`\`\`\n\n## README\n${readme.slice(0, 12000)}`;

  console.log('[gitdiagram] Analyse architecture…');
  const explanationRaw = await chatCompletion({
    apiKey,
    model,
    messages: [
      { role: 'system', content: SYSTEM_EXPLAIN },
      { role: 'user', content: context },
    ],
    maxTokens: 4000,
  });
  const explanation = extractXmlTag(explanationRaw, 'explanation');

  console.log('[gitdiagram] Génération Mermaid…');
  const mermaidRaw = await chatCompletion({
    apiKey,
    model,
    messages: [
      { role: 'system', content: SYSTEM_MERMAID },
      {
        role: 'user',
        content: `${context}\n\n## Architecture explanation\n${explanation}`,
      },
    ],
    maxTokens: 3000,
  });
  const mermaid = sanitizeMermaid(extractMermaidBlock(mermaidRaw) ?? mermaidRaw);

  await mkdir(OUT_DIR, { recursive: true });

  const md = `# Architecture système

> Diagramme généré automatiquement ([GitDiagram](https://github.com/ahmedkhaleel2004/gitdiagram) + OpenRouter).

## Vue d'ensemble

${explanation}

## Diagramme principal

\`\`\`mermaid
${mermaid}
\`\`\`
`;

  await writeFile(path.join(OUT_DIR, 'architecture.md'), md, 'utf8');
  await writeFile(path.join(OUT_DIR, 'architecture.mmd'), mermaid, 'utf8');
  console.log('[gitdiagram] Écrit docs/generated/architecture.md');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

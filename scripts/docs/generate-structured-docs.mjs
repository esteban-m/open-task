#!/usr/bin/env node
/**
 * Documentation structurée doc-as-code (Diátaxis) — un chapitre = un domaine métier.
 * Remplace l'ancienne génération fichier par fichier.
 */
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { writeGeneratedDoc } from './lib/safe-write.mjs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { GENERATED_SECTIONS } from './doc-structure.mjs';
import { bundleSources } from './lib/bundle-sources.mjs';
import { DIAGRAM_INJECTIONS, injectDiagram } from './lib/diagrams.mjs';
import { chatCompletion } from './lib/openrouter.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '../..');
const OUT_ROOT = path.join(REPO_ROOT, 'docs/generated');

const SYSTEM_PROMPT = `Tu es rédacteur technique senior pour une documentation doc-as-code en français.

Règles strictes:
- Rédige UN chapitre cohérent sur le sujet demandé (pas une liste de fichiers).
- Utilise EXACTEMENT les titres ## fournis dans le plan (dans le même ordre).
- Base-toi UNIQUEMENT sur les sources fournies ; n'invente pas d'endpoints ni de comportements.
- Mentionne les chemins de fichiers entre backticks quand tu expliques l'implémentation.
- Pas de formules du type "Ce fichier…" en ouverture de section.
- Ajoute des listes à puces et des tableaux si utile.
- Longueur cible : 500–900 mots.
- Termine par ## Voir aussi avec 2–4 liens UNIQUEMENT parmi cette liste (pas d'autres chemins) :
  /generated/architecture, /generated/database, /generated/api-reference,
  /generated/guide/introduction, /generated/explanation/realtime,
  /generated/backend/authentication, /generated/backend/lists-and-sharing,
  /generated/backend/tasks, /generated/backend/security,
  /generated/frontend/application, /generated/frontend/state-management,
  /generated/frontend/views, /guide/getting-started, /reference/environment, /operations/docker`;

async function main() {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error('OPENROUTER_API_KEY manquant');

  const model = process.env.OPENROUTER_MODEL ?? 'openai/gpt-4o-mini';

  let architecture = '';
  try {
    architecture = await readFile(path.join(OUT_ROOT, 'architecture.md'), 'utf8');
  } catch {
    /* optional */
  }

  // Supprime l'ancienne arborescence « modules »
  await rm(path.join(OUT_ROOT, 'modules'), { recursive: true, force: true });
  await rm(path.join(OUT_ROOT, 'modules.md'), { force: true });

  const manifest = [];

  for (const section of GENERATED_SECTIONS) {
    const outPath = path.join(OUT_ROOT, `${section.path}.md`);
    await mkdir(path.dirname(outPath), { recursive: true });

    console.log(`[doc] ${section.category}/${section.title}`);
    const bundle = await bundleSources(REPO_ROOT, section.sources);
    const outline = section.outline.join('\n');

    const body = await chatCompletion({
      apiKey,
      model,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        {
          role: 'user',
          content: [
            `# Chapitre: ${section.title}`,
            `Catégorie: ${section.category}`,
            '',
            '## Plan obligatoire',
            outline,
            '',
            '## Contexte architecture (extrait)',
            architecture.slice(0, 2500) || '_Non disponible_',
            '',
            '## Sources du dépôt',
            bundle,
          ].join('\n'),
        },
      ],
      maxTokens: 3500,
    });

    let md = `---
title: ${section.title}
---

# ${section.title}

> Chapitre généré automatiquement (doc-as-code). Dernière génération : pipeline CI.

${body}
`;

    const injection = DIAGRAM_INJECTIONS.find((d) => d.path === section.path);
    if (injection) {
      md = injectDiagram(md, injection);
    }

    await writeFile(outPath, md, 'utf8');
    manifest.push({
      category: section.category,
      path: section.path,
      title: section.title,
      link: `/generated/${section.path}`,
    });
  }

  await writeFile(
    path.join(OUT_ROOT, '.doc-manifest.json'),
    JSON.stringify({ sections: manifest, generatedAt: new Date().toISOString() }, null, 2),
    'utf8',
  );

  console.log(`[doc] ${manifest.length} chapitres structurés`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

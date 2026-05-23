import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';

import { bundleSources } from '../services/sources.mjs';
import { injectDiagram } from '../services/diagrams.mjs';
import {
  chatCompletion,
  resolveMistralCredentials,
  resolveMistralRequestOptions,
} from '../services/mistral.mjs';
import { buildAllowedLinksForPrompt } from '../services/navigation.mjs';
import { writeGeneratedDoc } from '../services/writer.mjs';

function interpolate(template, vars) {
  return template.replace(/\{(\w+)\}/g, (_, key) => vars[key] ?? `{${key}}`);
}

export async function generateChapters(config, paths, env) {
  const { apiKey, model } = resolveMistralCredentials(env, config);
  const { retry, requestDelayMs } = resolveMistralRequestOptions(env, config);
  const allowedLinks = buildAllowedLinksForPrompt(config);
  const systemPrompt = interpolate(config.prompts.chapterSystem, { allowedLinks });

  let architecture = '';
  try {
    architecture = await readFile(paths.generatedFile('architecture.md'), 'utf8');
  } catch {
    /* optional */
  }

  await rm(path.join(paths.generatedDir, 'modules'), { recursive: true, force: true });
  await rm(path.join(paths.generatedDir, 'modules.md'), { force: true });

  const manifest = [];
  const limits = {
    maxCharsPerFile: config.sources.bundleMaxCharsPerFile,
    maxTotalChars: config.sources.bundleMaxTotalChars,
  };

  for (const [index, chapter] of config.chapters.entries()) {
    const outPath = paths.chapterFile(chapter.path);
    await mkdir(path.dirname(outPath), { recursive: true });

    console.log(`[chapters] ${chapter.category}/${chapter.title}`);
    const bundle = await bundleSources(paths.repoRoot, chapter.sources, limits);
    const outline = chapter.outline.join('\n');

    const body = await chatCompletion({
      apiKey,
      model,
      retry,
      cooldownBeforeMs: index > 0 ? requestDelayMs : 0,
      messages: [
        { role: 'system', content: systemPrompt },
        {
          role: 'user',
          content: [
            `# Chapitre: ${chapter.title}`,
            `Catégorie: ${chapter.category}`,
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
      maxTokens: config.mistral.maxTokens.chapter,
    });

    let md = `---
title: ${chapter.title}
---

# ${chapter.title}

> Chapitre généré automatiquement (doc-as-code). Dernière génération : pipeline CI.

${body}
`;

    const injection = config.diagrams.find((d) => d.chapterPath === chapter.path);
    if (injection) {
      md = injectDiagram(md, {
        afterHeading: injection.afterHeading,
        sectionTitle: injection.sectionTitle,
        mermaid: injection.mermaid,
      });
    }

    // codeql[js/http-to-file-access]: chapter markdown sanitized in writeGeneratedDoc
    await writeGeneratedDoc(outPath, md, { baseDir: paths.generatedDir });
    manifest.push({
      category: chapter.category,
      path: chapter.path,
      title: chapter.title,
      link: `/generated/${chapter.path}`,
    });
  }

  await writeFile(
    paths.manifestFile,
    JSON.stringify({ sections: manifest, generatedAt: new Date().toISOString() }, null, 2),
    'utf8',
  );

  console.log(`[chapters] ${manifest.length} chapitres`);
}

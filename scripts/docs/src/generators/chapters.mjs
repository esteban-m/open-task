import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';

import { bundleSources } from '../services/sources.mjs';
import { injectDiagram } from '../services/diagrams.mjs';
import { chatCompletion } from '../services/openrouter.mjs';
import { buildAllowedLinksForPrompt } from '../services/navigation.mjs';
import { writeGeneratedDoc } from '../services/writer.mjs';

function interpolate(template, vars) {
  return template.replace(/\{(\w+)\}/g, (_, key) => vars[key] ?? `{${key}}`);
}

export async function generateChapters(config, paths, env) {
  const apiKey = env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error('OPENROUTER_API_KEY manquant');

  const model = env.OPENROUTER_MODEL ?? config.openrouter.defaultModel;
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

  for (const chapter of config.chapters) {
    const outPath = paths.chapterFile(chapter.path);
    await mkdir(path.dirname(outPath), { recursive: true });

    console.log(`[chapters] ${chapter.category}/${chapter.title}`);
    const bundle = await bundleSources(paths.repoRoot, chapter.sources, limits);
    const outline = chapter.outline.join('\n');

    const body = await chatCompletion({
      apiKey,
      model,
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
      maxTokens: config.openrouter.maxTokens.chapter,
      referer: env.OPENROUTER_SITE_URL,
      appName: config.openrouter.appName,
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

import { mkdir } from 'node:fs/promises';

import { buildLocalFileTree, fetchGithubTree, readReadme } from '../services/github.mjs';
import { parseGithubRepository, sanitizeApiText } from '../services/sanitize.mjs';
import {
  chatCompletion,
  extractMermaidBlock,
  extractXmlTag,
} from '../services/openrouter.mjs';
import { sanitizeMermaid } from '../services/mermaid.mjs';
import { writeGeneratedDoc } from '../services/writer.mjs';

function interpolate(template, vars) {
  return template.replace(/\{(\w+)\}/g, (_, key) => vars[key] ?? `{${key}}`);
}

export async function generateArchitecture(config, paths, env) {
  const apiKey = env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error('OPENROUTER_API_KEY manquant');

  const model = env.OPENROUTER_MODEL ?? config.openrouter.defaultModel;
  const { owner, repo } = parseGithubRepository(
    env.GITHUB_REPOSITORY ?? config.project.repository,
  );

  let fileTree;
  let readme;

  if (env.GITHUB_ACTIONS === 'true' && env.GITHUB_TOKEN) {
    const data = await fetchGithubTree({
      owner,
      repo,
      token: env.GITHUB_TOKEN,
      maxFiles: config.sources.githubTreeMaxFiles,
    });
    fileTree = data.fileTree;
    readme = data.readme;
  } else {
    fileTree = await buildLocalFileTree(paths.repoRoot, config.sources.githubTreeMaxFiles);
    readme = await readReadme(paths.repoRoot);
  }

  const context = `Repository: ${owner}/${repo}\n\n## File tree\n\`\`\`\n${sanitizeApiText(fileTree)}\n\`\`\`\n\n## README\n${sanitizeApiText(readme).slice(0, 12000)}`;
  const vars = {
    projectName: config.project.name,
    stack: config.project.description,
    stackHint: config.project.description,
  };

  console.log('[architecture] Analyse…');
  const explanationRaw = await chatCompletion({
    apiKey,
    model,
    messages: [
      { role: 'system', content: interpolate(config.prompts.architectureExplain, vars) },
      { role: 'user', content: context },
    ],
    maxTokens: config.openrouter.maxTokens.architectureExplain,
    referer: env.OPENROUTER_SITE_URL,
    appName: config.openrouter.appName,
  });
  const explanation = extractXmlTag(explanationRaw, 'explanation');

  console.log('[architecture] Mermaid…');
  const mermaidRaw = await chatCompletion({
    apiKey,
    model,
    messages: [
      { role: 'system', content: interpolate(config.prompts.architectureMermaid, vars) },
      { role: 'user', content: `${context}\n\n## Architecture explanation\n${explanation}` },
    ],
    maxTokens: config.openrouter.maxTokens.architectureMermaid,
    referer: env.OPENROUTER_SITE_URL,
    appName: config.openrouter.appName,
  });
  const mermaid = sanitizeMermaid(extractMermaidBlock(mermaidRaw) ?? mermaidRaw);

  await mkdir(paths.generatedDir, { recursive: true });

  const md = `# Architecture système

> Diagramme généré automatiquement ([GitDiagram](https://github.com/ahmedkhaleel2004/gitdiagram) + OpenRouter).

## Vue d'ensemble

${explanation}

## Diagramme principal

\`\`\`mermaid
${mermaid}
\`\`\`
`;

  await writeGeneratedDoc(paths.generatedFile('architecture.md'), md, {
    baseDir: paths.generatedDir,
  });
  await writeGeneratedDoc(paths.generatedFile('architecture.mmd'), mermaid, {
    baseDir: paths.generatedDir,
  });
  console.log('[architecture] docs/generated/architecture.md');
}

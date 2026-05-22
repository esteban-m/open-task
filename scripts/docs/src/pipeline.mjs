import { mkdir, writeFile } from 'node:fs/promises';

import { loadConfig } from './core/config.mjs';
import { createPaths } from './core/paths.mjs';
import { generateDatabase } from './generators/database.mjs';
import { generateApiReference } from './generators/api-reference.mjs';
import { generateArchitecture } from './generators/architecture.mjs';
import { generateChapters } from './generators/chapters.mjs';
import { assembleDocs } from './generators/assemble.mjs';

const GENERATORS = {
  database: generateDatabase,
  'api-reference': generateApiReference,
  architecture: generateArchitecture,
  chapters: generateChapters,
  assemble: assembleDocs,
};

export async function runPipeline(repoRoot, env = process.env) {
  const config = await loadConfig();
  const paths = createPaths(repoRoot, config);
  const skipAi = env.SKIP_AI === 'true';

  for (const step of config.pipeline.steps) {
    if (step.id === 'assemble') {
      await GENERATORS.assemble(repoRoot, config);
      continue;
    }

    if (step.requiresAi && skipAi) {
      if (step.id === 'architecture') {
        console.log('[pipeline] SKIP_AI — stub architecture');
        await mkdir(paths.generatedDir, { recursive: true });
        await writeFile(
          paths.generatedFile('architecture.md'),
          config.pipeline.skipAiStub,
          'utf8',
        );
      } else {
        console.log(`[pipeline] SKIP_AI — ignore ${step.id}`);
      }
      continue;
    }

    const fn = GENERATORS[step.id];
    if (!fn) throw new Error(`Générateur inconnu: ${step.id}`);
    await fn(config, paths, env);
  }

  console.log('[pipeline] Terminé — cd docs && npm run build');
}

import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

import { loadConfig } from '../core/config.mjs';
import { createPaths } from '../core/paths.mjs';
import { fixMermaidInMarkdown } from '../services/mermaid.mjs';
import { fixLinksInDir } from '../services/links.mjs';
import { buildSidebar } from '../services/navigation.mjs';
import { injectDiagramsIntoDir } from '../services/diagrams.mjs';

const MERMAID_TARGETS = ['generated/architecture.md', 'generated/database.md'];

export async function assembleDocs(repoRoot, config) {
  const paths = createPaths(repoRoot, config);
  const { docsDir, generatedDir } = paths;

  for (const rel of MERMAID_TARGETS) {
    const full = path.join(docsDir, rel);
    if (await fixMermaidInMarkdown(full, readFile, writeFile)) {
      console.log(`[assemble] Mermaid corrigé: ${rel}`);
    }
  }

  try {
    await fixLinksInDir(generatedDir, config);
    await injectDiagramsIntoDir(generatedDir, config.diagrams, readFile, writeFile);
  } catch (err) {
    if (err.code !== 'ENOENT') throw err;
  }

  const sidebar = await buildSidebar(config, paths);
  await writeFile(paths.sidebarFile, `${JSON.stringify(sidebar, null, 2)}\n`, 'utf8');
  console.log('[assemble] Navigation mise à jour');
}

export async function runAssemble(repoRoot) {
  const config = await loadConfig();
  await assembleDocs(repoRoot, config);
}

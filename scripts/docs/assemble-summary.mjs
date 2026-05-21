#!/usr/bin/env node
import { access, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  DOC_CATEGORIES,
  GENERATED_SECTIONS,
  SPECIAL_GENERATED,
  STATIC_PAGES,
} from './doc-structure.mjs';
import { sanitizeMermaid } from './lib/mermaid-sanitize.mjs';
import { fixLinksInDir } from './lib/fix-doc-links.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '../..');
const DOCS = path.join(REPO_ROOT, 'docs');
const GEN = path.join(DOCS, 'generated');

async function exists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function fixMermaidInFile(relPath) {
  const full = path.join(DOCS, relPath);
  if (!(await exists(full))) return;
  let content = await readFile(full, 'utf8');
  const replaced = content.replace(
    /```mermaid\n([\s\S]*?)```/g,
    (_, block) => `\`\`\`mermaid\n${sanitizeMermaid(block)}\n\`\`\``,
  );
  if (replaced !== content) {
    await writeFile(full, replaced, 'utf8');
    console.log(`[assemble] Mermaid corrigé: ${relPath}`);
  }
}

async function buildSidebar() {
  const sidebar = [{ text: 'Accueil', items: [{ text: 'Introduction', link: '/' }] }];

  const sortedCats = [...DOC_CATEGORIES].sort((a, b) => a.order - b.order);

  for (const cat of sortedCats) {
    const items = [];

    for (const page of STATIC_PAGES.filter((p) => p.category === cat.id)) {
      const rel = `${page.link.slice(1)}.md`;
      if (await exists(path.join(DOCS, rel))) {
        items.push({ text: page.title, link: page.link });
      }
    }

    for (const spec of SPECIAL_GENERATED.filter((p) => p.category === cat.id)) {
      if (await exists(path.join(GEN, spec.file))) {
        items.push({ text: spec.title, link: spec.link });
      }
    }

    for (const section of GENERATED_SECTIONS.filter((s) => s.category === cat.id)) {
      const rel = `generated/${section.path}.md`;
      if (await exists(path.join(DOCS, rel))) {
        items.push({ text: section.title, link: `/generated/${section.path}` });
      }
    }

    if (items.length) {
      sidebar.push({ text: cat.text, collapsed: cat.id !== 'guide', items });
    }
  }

  return sidebar;
}

async function main() {
  await fixMermaidInFile('generated/architecture.md');
  await fixMermaidInFile('generated/database.md');
  await fixLinksInDir(GEN);

  // Réinjecte diagrammes de flux (auth → chapitre auth, realtime → chapitre WS)
  try {
    const { spawn } = await import('node:child_process');
    await new Promise((resolve, reject) => {
      const child = spawn(process.execPath, [path.join(__dirname, 'inject-diagrams.mjs')], {
        stdio: 'inherit',
      });
      child.on('exit', (code) => (code === 0 ? resolve() : reject(new Error('inject-diagrams'))));
    });
  } catch {
    /* fichiers générés absents */
  }

  const sidebar = await buildSidebar();

  await writeFile(
    path.join(DOCS, '.vitepress/sidebar.generated.json'),
    `${JSON.stringify(sidebar, null, 2)}\n`,
    'utf8',
  );

  console.log('[assemble] Navigation doc-as-code mise à jour');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

import { readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

/** Liens hallucinés fréquents → chapitres réels */
const LINK_ALIASES = {
  '/generated/user-management': '/generated/backend/authentication',
  '/generated/task-management': '/generated/backend/tasks',
  '/generated/security': '/generated/backend/security',
  '/generated/authentication': '/generated/backend/authentication',
  '/generated/realtime': '/generated/explanation/realtime',
  '/generated/websocket': '/generated/explanation/realtime',
};

export async function fixLinksInDir(generatedDir) {
  const validLinks = new Set(await collectValidLinks(generatedDir));

  async function walk(dir) {
    for (const entry of await readdir(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) await walk(full);
      else if (entry.name.endsWith('.md')) await fixFile(full, validLinks);
    }
  }

  await walk(generatedDir);
}

async function collectValidLinks(generatedDir) {
  const links = new Set([
    '/generated/architecture',
    '/generated/database',
    '/generated/api-reference',
  ]);

  async function walk(dir, prefix = 'generated') {
    for (const entry of await readdir(dir, { withFileTypes: true })) {
      const rel = `${prefix}/${entry.name.replace(/\.md$/, '')}`;
      if (entry.isDirectory()) await walk(path.join(dir, entry.name), rel);
      else if (entry.name.endsWith('.md')) links.add(`/${rel}`);
    }
  }

  await walk(generatedDir);
  return links;
}

async function fixFile(filePath, validLinks) {
  let content = await readFile(filePath, 'utf8');

  for (const [bad, good] of Object.entries(LINK_ALIASES)) {
    content = content.replaceAll(`](${bad})`, `](${good})`);
    content = content.replaceAll(`](${bad}/)`, `](${good})`);
  }

  content = content.replace(/\[([^\]]+)\]\((\/generated\/[^)]+)\)/g, (match, label, href) => {
    const normalized = href.replace(/\/$/, '');
    if (validLinks.has(normalized)) return match;
    return label;
  });

  await writeFile(filePath, content, 'utf8');
}

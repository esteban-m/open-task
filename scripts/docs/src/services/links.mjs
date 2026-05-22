import { readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

import { collectValidLinks } from './navigation.mjs';

export async function fixLinksInDir(generatedDir, config) {
  const rewrites = config.linkRewrites ?? {};
  const validLinks = await collectValidLinks(config, generatedDir);

  async function walk(dir) {
    for (const entry of await readdir(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) await walk(full);
      else if (entry.name.endsWith('.md')) await fixFile(full, validLinks, rewrites);
    }
  }

  await walk(generatedDir);
}

async function fixFile(filePath, validLinks, rewrites) {
  let content = await readFile(filePath, 'utf8');

  for (const [bad, good] of Object.entries(rewrites)) {
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

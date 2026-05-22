import { readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

import { collectValidLinks } from './navigation.mjs';

const INTERNAL_PREFIXES = /^(?:\.\/)?(generated|guide|reference|operations)\//;

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

function normalizeHref(href) {
  let h = href.replace(/\/$/, '');
  if (h.startsWith('/')) return h;
  if (INTERNAL_PREFIXES.test(h)) return `/${h.replace(/^\.\//, '')}`;
  return h;
}

async function fixFile(filePath, validLinks, rewrites) {
  let content = await readFile(filePath, 'utf8');

  for (const [bad, good] of Object.entries(rewrites)) {
    content = content.replaceAll(`](${bad})`, `](${good})`);
    content = content.replaceAll(`](${bad}/)`, `](${good})`);
  }

  content = content.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (match, label, href) => {
    if (/^(https?:|mailto:|#)/i.test(href)) return match;

    const normalized = normalizeHref(href);
    if (validLinks.has(normalized)) {
      return normalized === href ? match : `[${label}](${normalized})`;
    }
    return label;
  });

  await writeFile(filePath, content, 'utf8');
}

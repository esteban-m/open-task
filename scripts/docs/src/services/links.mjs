import { readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

import { collectValidLinks } from './navigation.mjs';

const INTERNAL_PREFIXES = /^(?:\.\/)?(generated|guide|reference|operations)\//;
const INTERNAL_PATH_RE =
  /(\/(?:generated|guide|reference|operations)(?:\/[a-zA-Z0-9._/-]*)?)/;

/** Liens « Voir aussi » par défaut quand l’IA produit des URLs invalides. */
export const DEFAULT_SEE_ALSO = [
  { label: 'Architecture système', href: '/generated/architecture' },
  { label: 'API REST', href: '/generated/api-reference' },
  { label: 'Démarrage rapide', href: '/guide/getting-started' },
  { label: 'Variables d\'environnement', href: '/reference/environment' },
];

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

export function extractInternalDocPath(href) {
  const raw = String(href ?? '').trim();
  if (!raw || raw.startsWith('#') || raw.startsWith('mailto:')) return null;

  if (raw.startsWith('/') && !raw.startsWith('//')) {
    return raw.replace(/\/$/, '');
  }

  try {
    const url = new URL(raw);
    let pathname = url.pathname.replace(/\/$/, '') || '/';
    if (pathname.startsWith('/open-task/')) {
      pathname = pathname.slice('/open-task'.length) || '/';
    }
    const match = pathname.match(INTERNAL_PATH_RE);
    if (match) return match[1].replace(/\/$/, '');
  } catch {
    if (INTERNAL_PREFIXES.test(raw)) {
      return `/${raw.replace(/^\.\//, '')}`.replace(/\/$/, '');
    }
  }

  return null;
}

export function applyLinkRewrites(href, rewrites) {
  let h = href;
  for (const [bad, good] of Object.entries(rewrites)) {
    if (h === bad) return good;
  }
  return h;
}

export function normalizeMarkdownLink(label, href, validLinks, rewrites) {
  if (/^(https?:|mailto:|#)/i.test(href) && !extractInternalDocPath(href)) {
    return label;
  }

  let target = extractInternalDocPath(href) ?? normalizeRelativeHref(href);
  if (!target) return label;

  target = applyLinkRewrites(target, rewrites);

  if (validLinks.has(target)) {
    return `[${label}](${target})`;
  }

  return label;
}

function normalizeRelativeHref(href) {
  if (INTERNAL_PREFIXES.test(href)) {
    return `/${href.replace(/^\.\//, '')}`.replace(/\/$/, '');
  }
  return null;
}

export function repairVoirAussiSection(content, validLinks, rewrites) {
  const sectionRe = /(## Voir aussi\r?\n)([\s\S]*?)(?=\r?\n## |\r?\n---\r?\n|$)/g;

  return content.replace(sectionRe, (full, heading, body) => {
    const lines = body.split('\n');
    const repaired = [];
    let hadValidLink = false;

    for (const line of lines) {
      const m = line.match(/^\s*-\s*\[([^\]]+)\]\(([^)]+)\)\s*$/);
      if (!m) {
        if (line.trim()) repaired.push(line);
        continue;
      }
      const fixed = normalizeMarkdownLink(m[1], m[2], validLinks, rewrites);
      if (fixed.startsWith('[')) {
        repaired.push(`- ${fixed}`);
        hadValidLink = true;
      }
    }

    if (!hadValidLink) {
      for (const { label, href } of DEFAULT_SEE_ALSO) {
        const target = applyLinkRewrites(href, rewrites);
        if (validLinks.has(target)) {
          repaired.push(`- [${label}](${target})`);
        }
      }
    }

    return `${heading}${repaired.join('\n')}\n`;
  });
}

async function fixFile(filePath, validLinks, rewrites) {
  let content = await readFile(filePath, 'utf8');

  for (const [bad, good] of Object.entries(rewrites)) {
    content = content.replaceAll(`](${bad})`, `](${good})`);
    content = content.replaceAll(`](${bad}/)`, `](${good})`);
  }

  content = content.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (match, label, href) => {
    if (/^(mailto:|#)/i.test(href)) return match;
    const fixed = normalizeMarkdownLink(label, href, validLinks, rewrites);
    return fixed.startsWith('[') ? fixed : label;
  });

  content = repairVoirAussiSection(content, validLinks, rewrites);

  await writeFile(filePath, content, 'utf8');
}

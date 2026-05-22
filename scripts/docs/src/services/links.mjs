import { readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

import { collectValidLinks } from './navigation.mjs';

const INTERNAL_PREFIXES = /^(?:\.\/)?(generated|guide|reference|operations)\//;
const INTERNAL_PATH_RE =
  /(\/(?:generated|guide|reference|operations)(?:\/[a-zA-Z0-9._/-]*)?)/;

export function normalizeLabel(label) {
  return String(label)
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .trim();
}

/** Titres et alias pour réparer les listes « Voir aussi » (chemins ou libellés seuls). */
export function buildDocTitleMaps(config) {
  const pathToTitle = new Map();
  const labelToHref = new Map();

  function register(href, title) {
    const target = href.replace(/\/$/, '');
    pathToTitle.set(target, title);
    labelToHref.set(normalizeLabel(title), target);
  }

  for (const page of config.navigation?.generatedPages ?? []) {
    register(page.link, page.title);
  }
  for (const page of config.navigation?.staticPages ?? []) {
    register(page.link, page.title);
  }
  for (const chapter of config.chapters ?? []) {
    register(`/generated/${chapter.path}`, chapter.title);
  }

  const defaultSeeAlso = config.defaultSeeAlso ?? [];
  for (const { label, href } of defaultSeeAlso) {
    register(href, label);
  }

  for (const { label, href, title } of config.linkLabelAliases ?? []) {
    const target = href.replace(/\/$/, '');
    if (title) pathToTitle.set(target, title);
    if (!labelToHref.has(normalizeLabel(label))) {
      labelToHref.set(normalizeLabel(label), target);
    }
  }

  return { pathToTitle, labelToHref, defaultSeeAlso };
}

export async function fixLinksInDir(generatedDir, config) {
  const rewrites = config.linkRewrites ?? {};
  const validLinks = await collectValidLinks(config, generatedDir);
  const docMaps = buildDocTitleMaps(config);

  async function walk(dir) {
    for (const entry of await readdir(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) await walk(full);
      else if (entry.name.endsWith('.md')) await fixFile(full, validLinks, rewrites, docMaps);
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

export function normalizeRelativeHref(href) {
  if (INTERNAL_PREFIXES.test(href)) {
    return `/${href.replace(/^\.\//, '')}`.replace(/\/$/, '');
  }
  return null;
}

function resolveVoirAussiLine(line, validLinks, rewrites, pathToTitle, labelToHref) {
  let trimmed = line.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith('- ')) trimmed = trimmed.slice(2).trim();

  const linkMatch = trimmed.match(/^\[([^\]]+)\]\(([^)]+)\)\s*$/);
  if (linkMatch) {
    const fixed = normalizeMarkdownLink(linkMatch[1], linkMatch[2], validLinks, rewrites);
    return fixed.startsWith('[') ? fixed : null;
  }

  const pathMatch = trimmed.match(
    /^(\/(?:generated|guide|reference|operations)(?:\/[a-zA-Z0-9._/-]*)?)\s*$/,
  );
  if (pathMatch) {
    const target = applyLinkRewrites(pathMatch[1].replace(/\/$/, ''), rewrites);
    if (validLinks.has(target)) {
      const label = pathToTitle.get(target) ?? target.split('/').pop().replace(/-/g, ' ');
      return `[${label}](${target})`;
    }
    return null;
  }

  if (!trimmed.includes('](')) {
    const target = labelToHref.get(normalizeLabel(trimmed));
    if (target && validLinks.has(target)) {
      const label = pathToTitle.get(target) ?? trimmed;
      return `[${label}](${target})`;
    }
  }

  return null;
}

export function repairVoirAussiSection(content, validLinks, rewrites, docMaps = {}) {
  const sectionRe = /(## Voir aussi\r?\n)([\s\S]*?)(?=\r?\n## |\r?\n---\r?\n|$)/g;
  const pathToTitle = docMaps.pathToTitle ?? new Map();
  const labelToHref = docMaps.labelToHref ?? new Map();
  const defaultSeeAlso = docMaps.defaultSeeAlso ?? [];

  return content.replace(sectionRe, (full, heading, body) => {
    const seen = new Set();
    const repaired = [];

    for (const line of body.split('\n')) {
      const fixed = resolveVoirAussiLine(line, validLinks, rewrites, pathToTitle, labelToHref);
      if (!fixed) {
        if (line.trim() && !line.trim().startsWith('-')) repaired.push(line);
        continue;
      }
      const href = fixed.match(/\]\(([^)]+)\)/)?.[1];
      if (href && !seen.has(href)) {
        seen.add(href);
        repaired.push(`- ${fixed}`);
      }
    }

    if (repaired.length === 0) {
      for (const { label, href } of defaultSeeAlso) {
        const target = applyLinkRewrites(href, rewrites);
        if (validLinks.has(target) && !seen.has(target)) {
          seen.add(target);
          repaired.push(`- [${label}](${target})`);
        }
      }
    }

    return `${heading}${repaired.slice(0, 4).join('\n')}\n`;
  });
}

async function fixFile(filePath, validLinks, rewrites, docMaps) {
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

  content = repairVoirAussiSection(content, validLinks, rewrites, docMaps);

  await writeFile(filePath, content, 'utf8');
}

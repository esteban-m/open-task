import { access, readdir } from 'node:fs/promises';
import path from 'node:path';

export async function fileExists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

/** Liens valides dérivés de la config + scan du dossier généré. */
export async function collectValidLinks(config, generatedDir) {
  const links = new Set();

  for (const page of config.navigation.generatedPages) {
    links.add(page.link.replace(/\/$/, ''));
  }

  for (const chapter of config.chapters) {
    links.add(`/generated/${chapter.path}`);
  }

  async function walk(dir, prefix = 'generated') {
    for (const entry of await readdir(dir, { withFileTypes: true })) {
      const rel = `${prefix}/${entry.name.replace(/\.md$/, '')}`;
      if (entry.isDirectory()) await walk(path.join(dir, entry.name), rel);
      else if (entry.name.endsWith('.md')) links.add(`/${rel}`);
    }
  }

  if (await fileExists(generatedDir)) {
    await walk(generatedDir);
  }

  return links;
}

/** Liens autorisés dans les prompts IA (chapitres + pages statiques). */
export function buildAllowedLinksForPrompt(config) {
  const links = [
    ...config.navigation.generatedPages.map((p) => p.link),
    ...config.chapters.map((c) => `/generated/${c.path}`),
    ...config.navigation.staticPages.map((p) => p.link),
  ];
  return [...new Set(links)].join(', ');
}

export async function buildSidebar(config, paths) {
  const { docsDir, generatedDir } = paths;
  const home = config.navigation.home;
  const sidebar = [
    {
      text: 'Accueil',
      items: [{ text: home.text, link: home.link }],
    },
  ];

  const categories = [...config.navigation.categories].sort((a, b) => a.order - b.order);

  for (const cat of categories) {
    const items = [];

    for (const page of config.navigation.staticPages.filter((p) => p.category === cat.id)) {
      const rel = `${page.link.slice(1)}.md`;
      if (await fileExists(path.join(docsDir, rel))) {
        items.push({ text: page.title, link: page.link });
      }
    }

    for (const page of config.navigation.generatedPages.filter((p) => p.category === cat.id)) {
      if (await fileExists(path.join(generatedDir, page.file))) {
        items.push({ text: page.title, link: page.link });
      }
    }

    for (const chapter of config.chapters.filter((c) => c.category === cat.id)) {
      const rel = path.join(generatedDir, `${chapter.path}.md`);
      if (await fileExists(rel)) {
        items.push({ text: chapter.title, link: `/generated/${chapter.path}` });
      }
    }

    if (items.length) {
      sidebar.push({
        text: cat.text,
        collapsed: cat.expanded !== true,
        items,
      });
    }
  }

  return sidebar;
}

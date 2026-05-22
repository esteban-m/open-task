import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

const SKIP_DIRS = new Set([
  'node_modules',
  '.git',
  'dist',
  '.output',
  '.nuxt',
  'coverage',
  '.next',
  'vendor',
]);

const SKIP_EXT = new Set(['.lock', '.png', '.jpg', '.jpeg', '.gif', '.webp', '.ico', '.woff', '.woff2']);

/**
 * Arbre de fichiers local (CI) — même principe que GitDiagram côté GitHub API.
 */
export async function buildLocalFileTree(rootDir, maxFiles = 400) {
  const lines = [];
  let count = 0;

  async function walk(dir, prefix = '') {
    if (count >= maxFiles) return;
    const entries = await readdir(dir, { withFileTypes: true });

    entries.sort((a, b) => a.name.localeCompare(b.name));

    for (const entry of entries) {
      if (count >= maxFiles) return;
      if (entry.name.startsWith('.') && entry.name !== '.env.example') continue;
      if (SKIP_DIRS.has(entry.name)) continue;

      const rel = path.join(prefix, entry.name).replace(/\\/g, '/');
      if (entry.isDirectory()) {
        lines.push(`${rel}/`);
        await walk(path.join(dir, entry.name), rel);
      } else {
        const ext = path.extname(entry.name);
        if (SKIP_EXT.has(ext)) continue;
        lines.push(rel);
        count += 1;
      }
    }
  }

  await walk(rootDir);
  return lines.join('\n');
}

export async function readReadme(repoRoot) {
  for (const name of ['README.md', 'readme.md', 'Readme.md']) {
    try {
      return await readFile(path.join(repoRoot, name), 'utf8');
    } catch {
      // continue
    }
  }
  return '';
}

export async function fetchGithubTree({ owner, repo, token }) {
  const headers = {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const repoRes = await fetch(`https://api.github.com/repos/${owner}/${repo}`, { headers });
  if (!repoRes.ok) throw new Error(`GitHub repo: ${repoRes.status}`);
  const meta = await repoRes.json();

  const branch = meta.default_branch ?? 'main';
  const treeRes = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`,
    { headers },
  );
  if (!treeRes.ok) throw new Error(`GitHub tree: ${treeRes.status}`);
  const tree = await treeRes.json();

  const paths = (tree.tree ?? [])
    .filter((t) => t.type === 'blob')
    .map((t) => t.path)
    .filter((p) => !p.split('/').some((seg) => SKIP_DIRS.has(seg)))
    .filter((p) => !SKIP_EXT.has(path.extname(p)))
    .slice(0, 400);

  let readme = '';
  try {
    const readmeRes = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/readme`,
      { headers },
    );
    if (readmeRes.ok) {
      const data = await readmeRes.json();
      readme = Buffer.from(data.content ?? '', 'base64').toString('utf8');
    }
  } catch {
    // optional
  }

  return {
    defaultBranch: branch,
    fileTree: paths.join('\n'),
    readme,
    description: meta.description ?? '',
  };
}

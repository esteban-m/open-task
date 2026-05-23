import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

export function parseWikiPagesArgs(argv) {
  const opts = {
    outDir: 'wiki-out',
    sha: 'unknown',
    runUrl: '',
    repoRoot: process.cwd(),
    packages: [],
  };

  for (let i = 2; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--out-dir' && argv[i + 1]) opts.outDir = argv[++i];
    else if (arg === '--sha' && argv[i + 1]) opts.sha = argv[++i];
    else if (arg === '--run-url' && argv[i + 1]) opts.runUrl = argv[++i];
    else if (arg === '--repo-root' && argv[i + 1]) opts.repoRoot = argv[++i];
    else if (arg === '--package' && argv[i + 1]) {
      const [slug, title, summary, linesFile, badgeFile] = argv[++i].split(':');
      opts.packages.push({ slug, title, summary, linesFile, badgeFile });
    }
  }

  if (opts.packages.length === 0) {
    throw new Error(
      'Usage: wiki-pages --out-dir wiki-out --sha SHA --run-url URL '
        + '--package slug:title:summary.json:lines.md:badge.md [...]',
    );
  }
  return opts;
}

export function relSourcePath(fileKey, repoRoot) {
  const normalized = fileKey.replace(/\\/g, '/');
  const root = repoRoot.replace(/\\/g, '/');
  if (normalized.startsWith(`${root}/`)) return normalized.slice(root.length + 1);
  const idx = normalized.indexOf('/open-task/');
  if (idx !== -1) return normalized.slice(idx + '/open-task/'.length);
  return path.basename(normalized);
}

export function detailTable(summaryPath, repoRoot) {
  const data = JSON.parse(readFileSync(summaryPath, 'utf8'));
  const rows = [];

  for (const [file, metrics] of Object.entries(data)) {
    if (file === 'total') continue;
    const lines = metrics?.lines;
    if (!lines) continue;
    rows.push({
      file: relSourcePath(file, repoRoot),
      pct: lines.pct ?? 0,
      covered: lines.covered ?? 0,
      total: lines.total ?? 0,
    });
  }

  rows.sort((a, b) => a.pct - b.pct);
  if (rows.length === 0) return '_Aucun fichier dans le rapport._\n';

  const header = '| Fichier | Lignes | Couverture |\n| --- | --- | --- |\n';
  const body = rows
    .map((r) => `| \`${r.file}\` | ${r.covered}/${r.total} | ${r.pct}% |`)
    .join('\n');
  return `${header}${body}\n`;
}

function readFragment(filePath) {
  try {
    return readFileSync(filePath, 'utf8').trim();
  } catch {
    return '_Indisponible_';
  }
}

function buildPackagePage({ slug, title, summary, linesFile, badgeFile }, meta) {
  const lines = readFragment(linesFile);
  const badge = readFragment(badgeFile);
  const details = detailTable(summary, meta.repoRoot);

  return `# ${title}

> Généré par [CI Wiki — couverture](${meta.runUrl}). Commit \`${meta.sha}\` — ${meta.date}

${badge}

## Synthèse (action Coverage Summary Markdown)

${lines}

## Détail par fichier

${details}
`;
}

function buildIndexPage(packages, meta) {
  const global = packages.find((p) => p.slug === 'Couverture-des-tests') ?? packages[0];
  const others = packages.filter((p) => p.slug !== global.slug);
  const nav = others.map((p) => `- [${p.title}](${p.slug})`).join('\n');
  const lines = readFragment(global.linesFile);
  const badge = readFragment(global.badgeFile);

  return `# Couverture des tests

> Généré automatiquement par [CI Wiki — couverture](${meta.runUrl}).  
> Commit : \`${meta.sha}\` — ${meta.date}

${badge}

## Vue d’ensemble (monorepo)

${lines}

## Rapports par paquet

${nav}

---

Voir aussi : [README du dépôt](https://github.com/esteban-m/open-task).
`;
}

export function runWikiPages(argv = process.argv) {
  const opts = parseWikiPagesArgs(argv);
  mkdirSync(opts.outDir, { recursive: true });

  const meta = {
    sha: opts.sha,
    runUrl: opts.runUrl || 'https://github.com/esteban-m/open-task/actions',
    date: new Date().toISOString().slice(0, 10),
    repoRoot: opts.repoRoot,
  };

  for (const pkg of opts.packages) {
    const isIndex = pkg.slug === 'Couverture-des-tests';
    const content = isIndex ? buildIndexPage(opts.packages, meta) : buildPackagePage(pkg, meta);
    const outPath = path.join(opts.outDir, `${pkg.slug}.md`);
    writeFileSync(outPath, `${content}\n`, 'utf8');
    console.log(`[wiki] ${outPath}`);
  }
}

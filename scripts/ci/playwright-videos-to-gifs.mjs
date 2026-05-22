#!/usr/bin/env node
/**
 * Convertit les vidéos Playwright (test-results) en GIF pour docs/public/demo/{desktop|mobile}/.
 * Nécessite ffmpeg sur le PATH.
 *
 * Usage: node scripts/ci/playwright-videos-to-gifs.mjs [e2e/test-results] [docs/public/demo]
 */
import { spawnSync } from 'node:child_process';
import { mkdirSync, readdirSync, realpathSync, statSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const FPS = Number(process.env.DEMO_GIF_FPS || '8');
const WIDTH_DESKTOP = Number(process.env.DEMO_GIF_WIDTH_DESKTOP || '960');
const WIDTH_MOBILE = Number(process.env.DEMO_GIF_WIDTH_MOBILE || '390');
/** GIF attendus par variant (05 = mobile uniquement). */
const EXPECTED_BY_VARIANT = {
  desktop: [
    '01-inscription',
    '02-liste-tache',
    '03-vues-kanban-calendrier',
    '04-connexion',
    '06-themes',
    '07-kanban-drag',
    '08-calendrier-echelles',
    '09-partage-liste',
  ],
  mobile: [
    '01-inscription',
    '02-liste-tache',
    '03-vues-kanban-calendrier',
    '04-connexion',
    '05-mobile-navigation',
    '06-themes',
    '07-kanban-drag',
    '08-calendrier-echelles',
    '09-partage-liste',
  ],
};

/** Slugs stables (ordre : les plus longs en premier). */
const DEMO_SLUGS = [
  '09-partage-liste',
  '08-calendrier-echelles',
  '07-kanban-drag',
  '06-themes',
  '05-mobile-navigation',
  '04-connexion',
  '03-vues-kanban-calendrier',
  '02-liste-tache',
  '01-inscription',
];

function resolveSafeDir(arg, defaultRel) {
  const input = (arg || defaultRel).trim();
  if (!input || input.includes('..')) {
    throw new Error(`Chemin invalide: ${input}`);
  }
  const root = realpathSync(REPO_ROOT);
  const resolved = path.isAbsolute(input) ? path.resolve(input) : path.resolve(REPO_ROOT, input);
  if (!resolved.startsWith(`${root}${path.sep}`) && resolved !== root) {
    throw new Error(`Chemin hors du dépôt: ${input}`);
  }
  return resolved;
}

function hasFfmpeg() {
  const r = spawnSync('ffmpeg', ['-version'], { stdio: 'ignore' });
  return r.status === 0;
}

/**
 * Dossiers Playwright du type demo-03-vues-kanban-calendrier.demo.t-…-demo-desktop.
 * Les noms sont tronqués (~100 car.) : includes(slug complet) rate pour 03 et 08.
 */
function resolveSlugFromDirName(name) {
  // Playwright tronque au milieu du slug : demo-03-vues-kanban-calend-ea844-…
  // Chaque scénario a un numéro unique (01–09) → suffit pour retrouver le slug.
  const num = name.match(/demo-(0[1-9])-/);
  if (num) {
    const slug = DEMO_SLUGS.find((s) => s.startsWith(`${num[1]}-`));
    if (slug) return slug;
  }
  return DEMO_SLUGS.find((s) => name.includes(s)) ?? null;
}

function detectVariantFromDirName(name) {
  if (/demo-mobil/i.test(name)) return 'mobile';
  if (/demo-desk/i.test(name)) return 'desktop';
  return null;
}

function parseResultDir(name, variantFromParent) {
  const variant = variantFromParent ?? detectVariantFromDirName(name);
  if (!variant) return null;
  const slug = resolveSlugFromDirName(name);
  if (!slug) return null;
  return { slug, variant };
}

function findVideoWebm(dir) {
  const direct = path.join(dir, 'video.webm');
  try {
    statSync(direct);
    return direct;
  } catch {
    /* Playwright peut imbriquer l’artefact */
  }
  try {
    for (const entry of readdirSync(dir)) {
      if (!entry.endsWith('.webm')) continue;
      const full = path.join(dir, entry);
      if (statSync(full).isFile()) return full;
    }
  } catch {
    /* ignore */
  }
  return null;
}

function scanResultRoot(scanRoot, variantFromParent, depth = 0) {
  const found = [];
  let entries;
  try {
    entries = readdirSync(scanRoot);
  } catch {
    return found;
  }
  for (const entry of entries) {
    const full = path.join(scanRoot, entry);
    if (!statSync(full).isDirectory()) continue;

    const videoPath = findVideoWebm(full);
    if (videoPath) {
      const meta = parseResultDir(entry, variantFromParent);
      if (meta) {
        const resolved = realpathSync(videoPath);
        if (resolved.startsWith(`${scanRoot}${path.sep}`) || resolved.startsWith(scanRoot)) {
          found.push({ ...meta, videoPath: resolved });
        }
      } else {
        console.warn(`[gif] vidéo non mappée: ${full}`);
      }
      continue;
    }

    if (depth < 3 && variantFromParent) {
      found.push(...scanResultRoot(full, variantFromParent, depth + 1));
    }
  }
  return found;
}

function findVideos(root) {
  const found = [];
  const roots = [
    { dir: path.join(root, 'demo-desktop'), variant: 'desktop' },
    { dir: path.join(root, 'demo-mobile'), variant: 'mobile' },
    { dir: root, variant: null },
  ];
  for (const { dir, variant } of roots) {
    found.push(...scanResultRoot(dir, variant));
  }
  return found;
}

function toGif(videoPath, outPath, width) {
  mkdirSync(path.dirname(outPath), { recursive: true });
  const vf = `fps=${FPS},scale=${width}:-1:flags=lanczos,split[s0][s1];[s0]palettegen=max_colors=128[p];[s1][p]paletteuse=dither=bayer:bayer_scale=5`;
  const result = spawnSync(
    'ffmpeg',
    ['-y', '-i', videoPath, '-vf', vf, '-loop', '0', outPath],
    { stdio: 'pipe', encoding: 'utf8' },
  );
  if (result.status !== 0) {
    throw new Error(result.stderr || `ffmpeg exit ${result.status}`);
  }
}

function buildManifest(entries) {
  const lines = [
    '# Index des démos (généré par CI)',
    '',
    '| Scénario | Desktop | Mobile |',
    '|----------|---------|--------|',
  ];
  const slugs = [...new Set(entries.map((e) => e.slug))].sort();
  const bySlug = new Map();
  for (const { slug, variant } of entries) {
    if (!bySlug.has(slug)) bySlug.set(slug, { desktop: false, mobile: false });
    bySlug.get(slug)[variant] = true;
  }
  for (const slug of slugs) {
    const flags = bySlug.get(slug) ?? {};
    const desktop = flags.desktop ? `desktop/${slug}.gif` : '—';
    const mobile = flags.mobile ? `mobile/${slug}.gif` : '—';
    lines.push(`| ${slug} | ${desktop} | ${mobile} |`);
  }
  lines.push('');
  return `${lines.join('\n')}\n`;
}

const RESULTS_DIR = resolveSafeDir(process.argv[2], 'e2e/test-results');
const OUT_ROOT = resolveSafeDir(process.argv[3], 'docs/public/demo');

if (!hasFfmpeg()) {
  console.error('::error::ffmpeg introuvable — installer ffmpeg pour générer les GIF.');
  process.exit(1);
}

let videos;
try {
  videos = findVideos(RESULTS_DIR);
} catch (err) {
  console.error(`::error::Impossible de lire ${RESULTS_DIR}:`, err.message);
  process.exit(1);
}

if (videos.length === 0) {
  console.error(`::error::Aucune vidéo dans ${RESULTS_DIR} (lancer PLAYWRIGHT_DEMO=1 avant).`);
  process.exit(1);
}

const written = [];
for (const { slug, variant, videoPath } of videos) {
  const width = variant === 'mobile' ? WIDTH_MOBILE : WIDTH_DESKTOP;
  const outPath = path.join(OUT_ROOT, variant, `${slug}.gif`);
  console.log(`[gif] ${videoPath} → ${outPath} (${width}px)`);
  toGif(videoPath, outPath, width);
  written.push({ slug, variant });
}

mkdirSync(OUT_ROOT, { recursive: true });
writeFileSync(path.join(OUT_ROOT, 'INDEX.md'), buildManifest(written));

const writtenKeys = new Set(written.map((e) => `${e.variant}/${e.slug}`));
const missing = [];
for (const [variant, slugs] of Object.entries(EXPECTED_BY_VARIANT)) {
  for (const slug of slugs) {
    if (!writtenKeys.has(`${variant}/${slug}`)) {
      missing.push(`${variant}/${slug}.gif`);
    }
  }
}
if (missing.length > 0) {
  console.error(
    `::error::${missing.length} GIF manquant(s) (${written.length}/${Object.values(EXPECTED_BY_VARIANT).flat().length} attendus): ${missing.join(', ')}`,
  );
  console.error(
    '::error::Vérifier e2e/test-results (noms tronqués) et demo-desktop testMatch (03, 08).',
  );
  process.exit(1);
}

console.log(`[gif] ${written.length} GIF(s) → ${OUT_ROOT}`);

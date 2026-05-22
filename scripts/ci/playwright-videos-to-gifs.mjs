#!/usr/bin/env node
/**
 * Convertit les vidéos Playwright (test-results) en GIF pour assets/demo/{desktop|mobile}/.
 * Nécessite ffmpeg sur le PATH.
 *
 * Usage: node scripts/ci/playwright-videos-to-gifs.mjs [e2e/test-results] [assets/demo]
 */
import { spawnSync } from 'node:child_process';
import { mkdirSync, readdirSync, realpathSync, statSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const FPS = Number(process.env.DEMO_GIF_FPS || '8');
const WIDTH_DESKTOP = Number(process.env.DEMO_GIF_WIDTH_DESKTOP || '960');
const WIDTH_MOBILE = Number(process.env.DEMO_GIF_WIDTH_MOBILE || '390');
const SLUG_RE = /^\d{2}-[a-z0-9-]+$/i;

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

/** Dossiers Playwright du type *01-inscription*demo-desktop* */
function parseResultDir(name) {
  const variant = name.includes('demo-mobile')
    ? 'mobile'
    : name.includes('demo-desktop')
      ? 'desktop'
      : null;
  if (!variant) return null;
  const slugMatch = name.match(/(\d{2}-[a-z0-9-]+)/i);
  if (!slugMatch || !SLUG_RE.test(slugMatch[1])) return null;
  return { slug: slugMatch[1], variant };
}

function findVideos(root) {
  const found = [];
  for (const entry of readdirSync(root)) {
    const full = path.join(root, entry);
    if (!statSync(full).isDirectory()) continue;
    const meta = parseResultDir(entry);
    if (!meta) continue;
    const videoPath = path.join(full, 'video.webm');
    try {
      statSync(videoPath);
      const resolved = realpathSync(videoPath);
      if (!resolved.startsWith(`${root}${path.sep}`)) continue;
      found.push({ ...meta, videoPath: resolved });
    } catch {
      /* pas de vidéo pour ce run */
    }
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
  for (const slug of slugs) {
    const desktop = `desktop/${slug}.gif`;
    const mobile = `mobile/${slug}.gif`;
    lines.push(`| ${slug} | ![${slug} desktop](${desktop}) | ![${slug} mobile](${mobile}) |`);
  }
  lines.push('');
  return `${lines.join('\n')}\n`;
}

const RESULTS_DIR = resolveSafeDir(process.argv[2], 'e2e/test-results');
const OUT_ROOT = resolveSafeDir(process.argv[3], 'assets/demo');

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
console.log(`[gif] ${written.length} GIF(s) → ${OUT_ROOT}`);

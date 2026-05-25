import { spawnSync } from 'node:child_process';
import { mkdirSync, readdirSync, realpathSync, statSync, writeFileSync } from 'node:fs';
import path from 'node:path';

import { repoRoot } from '../core/paths.mjs';
import { expectedGifsByVariant, loadE2eConfig } from '../core/e2e-config.mjs';
import { parseResultDir } from './demo-slugs.mjs';

export function resolveSafeDir(input, defaultRel, root = repoRoot()) {
  const arg = (input || defaultRel).trim();
  if (!arg || arg.includes('..')) {
    throw new Error(`Chemin invalide: ${arg}`);
  }
  const resolved = path.isAbsolute(arg) ? path.resolve(arg) : path.resolve(root, arg);
  const rootReal = realpathSync(root);
  if (!resolved.startsWith(`${rootReal}${path.sep}`) && resolved !== rootReal) {
    throw new Error(`Chemin hors du dépôt: ${arg}`);
  }
  return resolved;
}

export function hasFfmpeg() {
  const r = spawnSync('ffmpeg', ['-version'], { stdio: 'ignore' });
  return r.status === 0;
}

export function findVideoWebm(dir) {
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

export function scanResultRoot(scanRoot, variantFromParent, depth = 0) {
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
      }
      continue;
    }

    if (depth < 3 && variantFromParent) {
      found.push(...scanResultRoot(full, variantFromParent, depth + 1));
    }
  }
  return found;
}

export function findVideos(resultsDir) {
  const found = [];
  const roots = [
    { dir: path.join(resultsDir, 'demo-desktop'), variant: 'desktop' },
    { dir: path.join(resultsDir, 'demo-mobile'), variant: 'mobile' },
    { dir: resultsDir, variant: null },
  ];
  for (const { dir, variant } of roots) {
    found.push(...scanResultRoot(dir, variant));
  }
  return found;
}

export function toGif(videoPath, outPath, width, fps) {
  mkdirSync(path.dirname(outPath), { recursive: true });
  const vf = `fps=${fps},scale=${width}:-1:flags=lanczos,split[s0][s1];[s0]palettegen=max_colors=128[p];[s1][p]paletteuse=dither=bayer:bayer_scale=5`;
  const result = spawnSync(
    'ffmpeg',
    ['-y', '-i', videoPath, '-vf', vf, '-loop', '0', outPath],
    { stdio: 'pipe', encoding: 'utf8' },
  );
  if (result.status !== 0) {
    throw new Error(result.stderr || `ffmpeg exit ${result.status}`);
  }
}

export function buildManifest(entries) {
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
    const flags = bySlug.get(slug);
    const desktop = flags?.desktop ? `desktop/${slug}.gif` : '—';
    const mobile = flags?.mobile ? `mobile/${slug}.gif` : '—';
    lines.push(`| ${slug} | ${desktop} | ${mobile} |`);
  }
  lines.push('');
  return `${lines.join('\n')}\n`;
}

export function validateExpectedGifs(written, config = loadE2eConfig()) {
  const expectedByVariant = expectedGifsByVariant(config);
  const writtenKeys = new Set(written.map((e) => `${e.variant}/${e.slug}`));
  const missing = [];
  for (const [variant, slugs] of Object.entries(expectedByVariant)) {
    for (const slug of slugs) {
      if (!writtenKeys.has(`${variant}/${slug}`)) {
        missing.push(`${variant}/${slug}.gif`);
      }
    }
  }
  return missing;
}

export function runVideosToGifs(argv = process.argv, root = repoRoot()) {
  const config = loadE2eConfig();
  const { gif, paths: demoPaths } = config.demo;
  const resultsDir = resolveSafeDir(argv[2], demoPaths.testResults, root);
  const outRoot = resolveSafeDir(argv[3], demoPaths.output, root);

  if (!hasFfmpeg()) {
    throw new Error('ffmpeg introuvable — installer ffmpeg pour générer les GIF.');
  }

  const videos = findVideos(resultsDir);
  if (videos.length === 0) {
    throw new Error(`Aucune vidéo dans ${resultsDir} (lancer PLAYWRIGHT_DEMO=1 avant).`);
  }

  const written = [];
  for (const { slug, variant, videoPath } of videos) {
    const width = variant === 'mobile' ? gif.widthMobile : gif.widthDesktop;
    const outPath = path.join(outRoot, variant, `${slug}.gif`);
    console.log(`[gif] ${videoPath} → ${outPath} (${width}px)`);
    toGif(videoPath, outPath, width, gif.fps);
    written.push({ slug, variant });
  }

  mkdirSync(outRoot, { recursive: true });
  writeFileSync(path.join(outRoot, 'INDEX.md'), buildManifest(written));

  const missing = validateExpectedGifs(written, config);
  if (missing.length > 0) {
    const expected = Object.values(expectedGifsByVariant(config)).flat().length;
    throw new Error(
      `${missing.length} GIF manquant(s) (${written.length}/${expected} attendus): ${missing.join(', ')}`,
    );
  }

  console.log(`[gif] ${written.length} GIF(s) → ${outRoot}`);
  return written;
}

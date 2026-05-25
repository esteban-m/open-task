import { mkdirSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';

const e2eMocks = vi.hoisted(() => ({ expectedOverride: null }));

vi.mock('../src/core/e2e-config.mjs', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    expectedGifsByVariant: (cfg) =>
      e2eMocks.expectedOverride ?? actual.expectedGifsByVariant(cfg),
  };
});

vi.mock('node:child_process', () => ({
  spawnSync: vi.fn(() => ({ status: 0 })),
}));

import { resetE2eConfigCache } from '../src/core/e2e-config.mjs';
import { parseResultDir } from '../src/playwright/demo-slugs.mjs';
import {
  buildManifest,
  findVideoWebm,
  findVideos,
  resolveSafeDir,
  runVideosToGifs,
  scanResultRoot,
  toGif,
  validateExpectedGifs,
} from '../src/playwright/videos-to-gifs.mjs';
import { repoRoot } from '../src/core/paths.mjs';

const { spawnSync } = await import('node:child_process');

function workDir(name) {
  return path.join(repoRoot(), name);
}

describe('videos-to-gifs helpers', () => {
  afterEach(() => {
    e2eMocks.expectedOverride = null;
    resetE2eConfigCache();
    vi.mocked(spawnSync).mockReset();
    vi.mocked(spawnSync).mockReturnValue({ status: 0 });
    for (const dir of [
      '.vitest-nested-results',
      '.vitest-vid-work',
      '.vitest-vid-alt',
      '.vitest-fake-root',
      '.vitest-playwright-results',
      '.vitest-demo-out',
      '.vitest-empty-results',
      '.vitest-empty-out',
    ]) {
      rmSync(workDir(dir), { recursive: true, force: true });
    }
    for (const file of ['.vitest-video.webm', '.vitest-out.gif', '.vitest-not-a-dir-file']) {
      rmSync(workDir(file), { force: true });
    }
  });

  it('buildManifest affiche un tiret si une variante manque', () => {
    const md = buildManifest([{ slug: '01-inscription', variant: 'desktop' }]);
    expect(md).toContain('—');
    expect(md).toContain('desktop/01-inscription.gif');
  });

  it('buildManifest liste desktop et mobile', () => {
    const md = buildManifest([
      { slug: '01-inscription', variant: 'desktop' },
      { slug: '01-inscription', variant: 'mobile' },
    ]);
    expect(md).toContain('01-inscription');
    expect(md).toContain('desktop/01-inscription.gif');
    expect(md).toContain('mobile/01-inscription.gif');
  });

  it('validateExpectedGifs signale les GIF manquants', () => {
    const missing = validateExpectedGifs([{ slug: '01-inscription', variant: 'desktop' }]);
    expect(missing.length).toBeGreaterThan(0);
    expect(missing.some((m) => m.includes('mobile/01-inscription'))).toBe(true);
  });

  it('resolveSafeDir résout sous la racine du dépôt', () => {
    const root = repoRoot();
    const resolved = resolveSafeDir(undefined, 'e2e/test-results', root);
    expect(resolved).toBe(path.join(root, 'e2e/test-results'));
    const abs = path.join(root, 'e2e/test-results');
    expect(resolveSafeDir(abs, 'e2e/test-results', root)).toBe(abs);
    expect(() => resolveSafeDir('../escape', 'e2e/test-results', root)).toThrow(/invalide/);

    const fakeRoot = workDir('.vitest-fake-root');
    const outside = workDir('.vitest-outside-repo');
    mkdirSync(fakeRoot, { recursive: true });
    mkdirSync(outside, { recursive: true });
    expect(() => resolveSafeDir(outside, 'x', fakeRoot)).toThrow(/hors du dépôt/);
  });

  it('scanResultRoot ignore les fichiers et chemins hors racine', () => {
    const base = workDir('.vitest-scan-skip');
    rmSync(base, { recursive: true, force: true });
    mkdirSync(base, { recursive: true });
    writeFileSync(path.join(base, 'not-a-dir.txt'), 'mock');
    expect(scanResultRoot(base, 'desktop')).toEqual([]);

    const nested = path.join(base, 'demo-01-inscription-demo-desktop');
    mkdirSync(nested, { recursive: true });
    writeFileSync(path.join(nested, 'video.webm'), 'mock');
    const found = scanResultRoot(base, 'desktop');
    expect(found.some((v) => v.slug === '01-inscription')).toBe(true);
  });

  it('scanResultRoot ignore les vidéos hors du répertoire scanné', () => {
    const base = workDir('.vitest-scan-outside');
    rmSync(base, { recursive: true, force: true });
    const outside = workDir('.vitest-outside-repo');
    rmSync(outside, { recursive: true, force: true });
    mkdirSync(base, { recursive: true });
    mkdirSync(outside, { recursive: true });
    writeFileSync(path.join(outside, 'video.webm'), 'mock');
    const nested = path.join(base, 'demo-01-inscription-demo-desktop');
    mkdirSync(nested, { recursive: true });
    symlinkSync(path.join(outside, 'video.webm'), path.join(nested, 'video.webm'));
    const found = scanResultRoot(base, 'desktop');
    expect(found).toEqual([]);
  });

  it('buildManifest affiche — pour variantes manquantes', () => {
    const md = buildManifest([{ slug: '01-inscription', variant: 'desktop' }]);
    expect(md).toContain('| 01-inscription | desktop/01-inscription.gif | — |');
  });

  it('toGif utilise le message de sortie par défaut', () => {
    const video = workDir('.vitest-video2.webm');
    const out = workDir('.vitest-out2.gif');
    writeFileSync(video, 'mock');
    vi.mocked(spawnSync).mockReturnValue({ status: 2, stderr: '' });
    expect(() => toGif(video, out, 100, 8)).toThrow(/ffmpeg exit 2/);
  });

  it('scanResultRoot gère répertoire absent et imbrication', () => {
    expect(scanResultRoot('/chemin/inexistant', 'desktop')).toEqual([]);

    const base = workDir('.vitest-nested-results');
    const inner = path.join(
      base,
      'demo-desktop',
      'wrapper',
      'deep',
      'demo-01-inscription-x-demo-desktop',
    );
    mkdirSync(inner, { recursive: true });
    writeFileSync(path.join(inner, 'video.webm'), 'mock');

    const found = scanResultRoot(path.join(base, 'demo-desktop'), 'desktop');
    expect(found.some((v) => v.slug === '01-inscription')).toBe(true);
  });

  it('toGif propage une erreur ffmpeg', () => {
    const video = workDir('.vitest-video.webm');
    const out = workDir('.vitest-out.gif');
    writeFileSync(video, 'mock');
    vi.mocked(spawnSync).mockReturnValue({ status: 1, stderr: 'ffmpeg failed' });
    expect(() => toGif(video, out, 100, 8)).toThrow(/ffmpeg/);
  });

  it('findVideoWebm trouve video.webm ou premier .webm', () => {
    const dir = workDir('.vitest-vid-work');
    const nested = path.join(dir, 'demo-01-inscription-demo-desktop');
    mkdirSync(nested, { recursive: true });
    writeFileSync(path.join(nested, 'video.webm'), 'mock');
    expect(findVideoWebm(nested)).toBe(path.join(nested, 'video.webm'));

    const alt = workDir('.vitest-vid-alt');
    mkdirSync(alt, { recursive: true });
    writeFileSync(path.join(alt, 'capture.webm'), 'mock');
    expect(findVideoWebm(alt)).toBe(path.join(alt, 'capture.webm'));

    const notDir = workDir('.vitest-not-a-dir-file');
    writeFileSync(notDir, 'mock');
    expect(findVideoWebm(notDir)).toBeNull();
  });

  it('parseResultDir résout slug et variant', () => {
    expect(parseResultDir('demo-02-liste-tache-abc-demo-desktop', 'desktop')).toEqual({
      slug: '02-liste-tache',
      variant: 'desktop',
    });
  });

  it('findVideos détecte les vidéos sous la racine du dépôt', () => {
    const results = workDir('.vitest-playwright-results');
    const desktopDir = path.join(results, 'demo-desktop', 'demo-02-liste-tache-abc-demo-desktop');
    mkdirSync(desktopDir, { recursive: true });
    writeFileSync(path.join(desktopDir, 'video.webm'), 'mock');

    const found = findVideos(results);
    expect(found.some((v) => v.slug === '02-liste-tache' && v.variant === 'desktop')).toBe(true);
  });

  it('runVideosToGifs termine quand tous les GIF attendus sont là', () => {
    const root = repoRoot();
    const results = workDir('.vitest-playwright-results');
    const out = workDir('.vitest-demo-out');
    const desktop = path.join(results, 'demo-desktop', 'demo-01-inscription-x-demo-desktop');
    mkdirSync(desktop, { recursive: true });
    writeFileSync(path.join(desktop, 'video.webm'), 'mock');
    vi.mocked(spawnSync).mockReturnValue({ status: 0 });
    e2eMocks.expectedOverride = { desktop: ['01-inscription'], mobile: [] };
    const log = vi.spyOn(console, 'log').mockImplementation(() => undefined);

    const written = runVideosToGifs(['node', 'cli', results, out], root);
    expect(written.length).toBe(1);
    expect(log).toHaveBeenCalledWith(expect.stringMatching(/\[gif\] 1 GIF/));

    log.mockRestore();
  });

  it('runVideosToGifs génère un GIF mobile', () => {
    const root = repoRoot();
    const results = workDir('.vitest-playwright-results');
    const out = workDir('.vitest-demo-out');
    const mobile = path.join(results, 'demo-mobile', 'demo-01-inscription-demo-mobile');
    mkdirSync(mobile, { recursive: true });
    writeFileSync(path.join(mobile, 'video.webm'), 'mock');
    vi.mocked(spawnSync).mockReturnValue({ status: 0 });
    e2eMocks.expectedOverride = { desktop: [], mobile: ['01-inscription'] };
    const written = runVideosToGifs(['node', 'cli', results, out], root);
    expect(written.some((w) => w.variant === 'mobile')).toBe(true);
  });

  it('runVideosToGifs convertit puis valide les GIF attendus', () => {
    const root = repoRoot();
    const results = workDir('.vitest-playwright-results');
    const out = workDir('.vitest-demo-out');
    const desktop = path.join(results, 'demo-desktop', 'demo-01-inscription-x-demo-desktop');
    mkdirSync(desktop, { recursive: true });
    writeFileSync(path.join(desktop, 'video.webm'), 'mock');

    vi.mocked(spawnSync).mockReturnValue({ status: 0 });

    try {
      runVideosToGifs(['node', 'cli', results, out], root);
    } catch (err) {
      expect(err.message).toMatch(/GIF manquant/);
    }
    expect(spawnSync).toHaveBeenCalled();
  });

  it('runVideosToGifs échoue sans ffmpeg', () => {
    vi.mocked(spawnSync).mockReturnValue({ status: 1 });
    expect(() => runVideosToGifs(['node', 'cli'], repoRoot())).toThrow(/ffmpeg/);
  });

  it('runVideosToGifs échoue sans vidéos', () => {
    vi.mocked(spawnSync).mockReturnValue({ status: 0 });
    const root = repoRoot();
    const empty = workDir('.vitest-empty-results');
    const out = workDir('.vitest-empty-out');
    mkdirSync(empty, { recursive: true });
    mkdirSync(out, { recursive: true });
    expect(() => runVideosToGifs(['node', 'cli', empty, out], root)).toThrow(/Aucune vidéo/);
  });
});

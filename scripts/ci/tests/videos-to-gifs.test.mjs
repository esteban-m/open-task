import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
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

describe('videos-to-gifs helpers', () => {
  afterEach(() => {
    e2eMocks.expectedOverride = null;
    resetE2eConfigCache();
    vi.mocked(spawnSync).mockReset();
    vi.mocked(spawnSync).mockReturnValue({ status: 0 });
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
    const fakeRoot = mkdtempSync(path.join(tmpdir(), 'repo-root-'));
    const outside = mkdtempSync(path.join(tmpdir(), 'outside-repo-'));
    expect(() => resolveSafeDir(outside, 'x', fakeRoot)).toThrow(/hors du dépôt/);
  });

  it('scanResultRoot gère répertoire absent et imbrication', () => {
    expect(scanResultRoot('/chemin/inexistant', 'desktop')).toEqual([]);

    const root = repoRoot();
    const base = path.join(root, '.vitest-nested-results');
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
    rmSync(base, { recursive: true, force: true });
  });

  it('toGif propage une erreur ffmpeg', () => {
    const root = repoRoot();
    const video = path.join(root, '.vitest-video.webm');
    const out = path.join(root, '.vitest-out.gif');
    writeFileSync(video, 'mock');
    vi.mocked(spawnSync).mockReturnValue({ status: 1, stderr: 'ffmpeg failed' });
    expect(() => toGif(video, out, 100, 8)).toThrow(/ffmpeg/);
    rmSync(video, { force: true });
    rmSync(out, { force: true });
  });

  it('findVideoWebm trouve video.webm ou premier .webm', () => {
    const dir = mkdtempSync(path.join(tmpdir(), 'vid-'));
    const nested = path.join(dir, 'demo-01-inscription-demo-desktop');
    mkdirSync(nested, { recursive: true });
    writeFileSync(path.join(nested, 'video.webm'), 'mock');
    expect(findVideoWebm(nested)).toBe(path.join(nested, 'video.webm'));

    const alt = mkdtempSync(path.join(tmpdir(), 'vid-alt-'));
    writeFileSync(path.join(alt, 'capture.webm'), 'mock');
    expect(findVideoWebm(alt)).toBe(path.join(alt, 'capture.webm'));

    const notDir = path.join(tmpdir(), `not-a-dir-${Date.now()}`);
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
    const root = repoRoot();
    const results = path.join(root, '.vitest-playwright-results');
    const desktopDir = path.join(results, 'demo-desktop', 'demo-02-liste-tache-abc-demo-desktop');
    mkdirSync(desktopDir, { recursive: true });
    writeFileSync(path.join(desktopDir, 'video.webm'), 'mock');

    const found = findVideos(results);
    expect(found.some((v) => v.slug === '02-liste-tache' && v.variant === 'desktop')).toBe(true);

    rmSync(results, { recursive: true, force: true });
  });

  it('runVideosToGifs termine quand tous les GIF attendus sont là', () => {
    const root = repoRoot();
    const results = path.join(root, '.vitest-playwright-results');
    const out = path.join(root, '.vitest-demo-out');
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
    rmSync(results, { recursive: true, force: true });
    rmSync(out, { recursive: true, force: true });
  });

  it('runVideosToGifs convertit puis valide les GIF attendus', () => {
    const root = repoRoot();
    const results = path.join(root, '.vitest-playwright-results');
    const out = path.join(root, '.vitest-demo-out');
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
    rmSync(results, { recursive: true, force: true });
    rmSync(out, { recursive: true, force: true });
  });

  it('runVideosToGifs échoue sans ffmpeg', () => {
    vi.mocked(spawnSync).mockReturnValue({ status: 1 });
    expect(() => runVideosToGifs(['node', 'cli'], repoRoot())).toThrow(/ffmpeg/);
  });

  it('runVideosToGifs échoue sans vidéos', () => {
    vi.mocked(spawnSync).mockReturnValue({ status: 0 });
    const root = repoRoot();
    const empty = path.join(root, '.vitest-empty-results');
    const out = path.join(root, '.vitest-empty-out');
    mkdirSync(empty, { recursive: true });
    mkdirSync(out, { recursive: true });
    expect(() => runVideosToGifs(['node', 'cli', empty, out], root)).toThrow(/Aucune vidéo/);
    rmSync(empty, { recursive: true, force: true });
    rmSync(out, { recursive: true, force: true });
  });
});

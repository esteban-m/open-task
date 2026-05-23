import { afterEach, describe, expect, it } from 'vitest';

import {
  demoSlugs,
  desktopDemoTestMatch,
  expectedGifsByVariant,
  loadE2eConfig,
  printStackEnv,
  resetE2eConfigCache,
  todayIsoDateLocal,
  todayIsoDateUtc,
} from '../src/core/e2e-config.mjs';

describe('e2e-config', () => {
  afterEach(() => {
    resetE2eConfigCache();
    delete process.env.BACKEND_PORT;
    delete process.env.DATABASE_URL;
  });

  it('loadE2eConfig expose stack, testUser et demo', () => {
    const cfg = loadE2eConfig();
    expect(cfg.stack.backendPort).toBe(4000);
    expect(cfg.testUser.password).toBe('password123');
    expect(cfg.demo.scenarios.length).toBe(9);
    expect(cfg.playwright.expectTimeoutMs).toBe(15000);
  });

  it('apply env overrides ports and database url', () => {
    process.env.BACKEND_PORT = '4999';
    resetE2eConfigCache();
    const cfg = loadE2eConfig();
    expect(cfg.stack.backendPort).toBe(4999);
    expect(cfg.stack.databaseUrl).toContain(':5433/');
    expect(cfg.stack.apiBaseUrl).toContain(':4999');
  });

  it('ignore les variables env non numériques', () => {
    process.env.BACKEND_PORT = 'pas-un-port';
    process.env.DEMO_GIF_FPS = 'abc';
    resetE2eConfigCache();
    const cfg = loadE2eConfig();
    expect(cfg.stack.backendPort).toBe(4000);
    expect(cfg.demo.gif.fps).toBe(8);
  });

  it('demoSlugs triés par longueur décroissante', () => {
    const slugs = demoSlugs();
    expect(slugs[0]).toBe('03-vues-kanban-calendrier');
    expect(slugs).toContain('01-inscription');
  });

  it('expectedGifsByVariant sépare desktop et mobile', () => {
    const expected = expectedGifsByVariant();
    expect(expected.mobile).toContain('05-mobile-navigation');
    expect(expected.desktop).not.toContain('05-mobile-navigation');
    expect(expected.desktop).toContain('01-inscription');
  });

  it('desktopDemoTestMatch génère des RegExp par fichier desktop', () => {
    const patterns = desktopDemoTestMatch();
    expect(patterns.some((re) => re.test('demo/01-inscription.demo.ts'))).toBe(true);
    expect(patterns.some((re) => re.test('demo/05-mobile-navigation.demo.ts'))).toBe(false);
  });

  it('printStackEnv exporte les variables stack', () => {
    const env = printStackEnv();
    expect(env).toContain('export DATABASE_URL=');
    expect(env).toContain('export PLAYWRIGHT_BASE_URL=');
    expect(env).toContain('export E2E_TEST_PASSWORD=');
  });

  it('printStackEnv propage PLAYWRIGHT_DEMO si défini', () => {
    process.env.PLAYWRIGHT_DEMO = '1';
    resetE2eConfigCache();
    expect(printStackEnv()).toContain('export PLAYWRIGHT_DEMO="1"');
    delete process.env.PLAYWRIGHT_DEMO;
  });

  it('todayIsoDate helpers format YYYY-MM-DD', () => {
    expect(todayIsoDateUtc()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(todayIsoDateLocal()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

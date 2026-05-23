import { readFileSync } from 'node:fs';
import path from 'node:path';

import { repoRoot } from './paths.mjs';

let cache = null;

function configDir() {
  return path.join(repoRoot(), 'config');
}

function num(envVal, fallback) {
  if (envVal === undefined || envVal === '') return fallback;
  const n = Number(envVal);
  return Number.isFinite(n) ? n : fallback;
}

function applyEnv(raw) {
  const stack = raw.stack;
  const backendPort = num(process.env.BACKEND_PORT, stack.backendPort);
  const frontendPort = num(process.env.FRONTEND_PORT, stack.frontendPort);
  const postgresPort = num(process.env.POSTGRES_PORT, stack.postgresPort);

  const databaseUrl =
    process.env.DATABASE_URL
    ?? `postgresql://${stack.postgresUser}:${stack.postgresPassword}@127.0.0.1:${postgresPort}/${stack.postgresDb}`;

  const frontendUrl = process.env.FRONTEND_URL ?? `http://127.0.0.1:${frontendPort}`;
  const playwrightBaseUrl = process.env.PLAYWRIGHT_BASE_URL ?? frontendUrl;

  return {
    ...raw,
    stack: {
      ...stack,
      backendPort,
      frontendPort,
      postgresPort,
      databaseUrl,
      frontendUrl,
      playwrightBaseUrl,
      apiBaseUrl: process.env.NUXT_PUBLIC_API_BASE_URL ?? `http://127.0.0.1:${backendPort}`,
      wsBaseUrl: process.env.NUXT_PUBLIC_WS_BASE_URL ?? `http://127.0.0.1:${backendPort}`,
    },
    demo: {
      ...raw.demo,
      pauses: {
        ...raw.demo.pauses,
        stepMs: num(process.env.DEMO_STEP_PAUSE_MS, raw.demo.pauses.stepMs),
        sceneMs: num(process.env.DEMO_SCENE_PAUSE_MS, raw.demo.pauses.sceneMs),
      },
      gif: {
        fps: num(process.env.DEMO_GIF_FPS, raw.demo.gif.fps),
        widthDesktop: num(process.env.DEMO_GIF_WIDTH_DESKTOP, raw.demo.gif.widthDesktop),
        widthMobile: num(process.env.DEMO_GIF_WIDTH_MOBILE, raw.demo.gif.widthMobile),
      },
    },
  };
}

/** Charge `config/open-task.e2e.json` (cache + surcharge env). */
export function loadE2eConfig() {
  if (!cache) {
    const raw = readFileSync(path.join(configDir(), 'open-task.e2e.json'), 'utf8');
    cache = applyEnv(JSON.parse(raw));
  }
  return cache;
}

export function resetE2eConfigCache() {
  cache = null;
}

/** Date du jour `YYYY-MM-DD` (fuseau local — champs HTML date). */
export function todayIsoDateLocal() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Date du jour `YYYY-MM-DD` (UTC — tests backend stables). */
export function todayIsoDateUtc() {
  return new Date().toISOString().slice(0, 10);
}

/** Slugs démo triés (longs d’abord) pour résolution noms Playwright tronqués. */
export function demoSlugs(config = loadE2eConfig()) {
  return [...config.demo.scenarios]
    .map((s) => s.slug)
    .sort((a, b) => b.length - a.length);
}

/** GIF attendus par variant desktop/mobile. */
export function expectedGifsByVariant(config = loadE2eConfig()) {
  const out = { desktop: [], mobile: [] };
  for (const scenario of config.demo.scenarios) {
    if (scenario.desktop) out.desktop.push(scenario.slug);
    if (scenario.mobile) out.mobile.push(scenario.slug);
  }
  return out;
}

/** `testMatch` Playwright pour les scénarios démo desktop. */
export function desktopDemoTestMatch(config = loadE2eConfig()) {
  const files = config.demo.scenarios.filter((s) => s.desktop).map((s) => s.file);
  return files.map((f) => new RegExp(`demo/${f.replace('.', '\\.')}$`));
}

/** Export shell `KEY=value` pour run-playwright-stack.sh */
export function printStackEnv(config = loadE2eConfig()) {
  const { stack, testUser } = config;
  const lines = [
    `export DATABASE_URL="${process.env.DATABASE_URL ?? stack.databaseUrl}"`,
    `export JWT_SECRET="${process.env.JWT_SECRET ?? stack.jwtSecret}"`,
    `export JWT_REFRESH_SECRET="${process.env.JWT_REFRESH_SECRET ?? stack.jwtRefreshSecret}"`,
    `export FRONTEND_URL="${stack.frontendUrl}"`,
    `export NUXT_PUBLIC_API_BASE_URL="${stack.apiBaseUrl}"`,
    `export NUXT_PUBLIC_WS_BASE_URL="${stack.wsBaseUrl}"`,
    `export PLAYWRIGHT_BASE_URL="${stack.playwrightBaseUrl}"`,
    `export PORT="${stack.backendPort}"`,
    `export BACKEND_PORT="${stack.backendPort}"`,
    `export FRONTEND_PORT="${stack.frontendPort}"`,
    `export WAIT_ON_TIMEOUT_MS="${stack.waitOnTimeoutMs}"`,
    `export E2E_TEST_PASSWORD="${testUser.password}"`,
  ];
  if (process.env.PLAYWRIGHT_DEMO) {
    lines.push(`export PLAYWRIGHT_DEMO="${process.env.PLAYWRIGHT_DEMO}"`);
  }
  return `${lines.join('\n')}\n`;
}

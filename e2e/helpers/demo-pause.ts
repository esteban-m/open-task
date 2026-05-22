import type { Page } from '@playwright/test';

const isDemo = process.env.PLAYWRIGHT_DEMO === '1';

/** Pause courte entre actions (lisibilité des GIF). */
export const DEMO_STEP_MS = Number(process.env.DEMO_STEP_PAUSE_MS || '500');

/** Pause de fin de scène (laisser le résultat à l’écran). */
export const DEMO_SCENE_MS = Number(process.env.DEMO_SCENE_PAUSE_MS || '1500');

export async function pauseDemoStep(page: Page, ms = DEMO_STEP_MS) {
  if (isDemo) await page.waitForTimeout(ms);
}

export async function pauseDemoScene(page: Page, ms = DEMO_SCENE_MS) {
  if (isDemo) await page.waitForTimeout(ms);
}

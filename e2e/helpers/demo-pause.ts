import type { Page } from '@playwright/test';
import { loadE2eConfig } from '../../config/load-e2e.mjs';

const cfg = loadE2eConfig();
const pauses = cfg.demo.pauses;
const isDemo = process.env.PLAYWRIGHT_DEMO === '1';

export const demoStepMs = pauses.stepMs;
export const demoSceneMs = pauses.sceneMs;

export async function pauseDemoStep(page: Page, ms = demoStepMs) {
  if (isDemo) await page.waitForTimeout(ms);
}

export async function pauseDemoScene(page: Page, ms = demoSceneMs) {
  if (isDemo) await page.waitForTimeout(ms);
}

import { defineConfig, devices } from '@playwright/test';
import { desktopDemoTestMatch, loadE2eConfig } from '../config/load-e2e.mjs';

const cfg = loadE2eConfig();
const isDemo = process.env.PLAYWRIGHT_DEMO === '1';
const isCi = Boolean(process.env.CI);
const pw = cfg.playwright;
const demo = cfg.demo;

export default defineConfig({
  testDir: './tests',
  timeout: pw.timeoutMs,
  expect: { timeout: pw.expectTimeoutMs },
  retries: isCi ? (isDemo ? pw.retries.ciDemo : pw.retries.ci) : pw.retries.local,
  workers: pw.workers,
  reporter: isCi ? [['github'], ['list']] : [['list']],
  use: {
    baseURL: cfg.stack.playwrightBaseUrl,
    trace: isDemo ? 'off' : 'on-first-retry',
    screenshot: isDemo ? 'off' : 'only-on-failure',
    video: isDemo ? 'on' : 'retain-on-failure',
  },
  projects: [
    {
      name: 'smoke-desktop',
      testMatch: /smoke\/.*\.spec\.ts/,
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'demo-desktop',
      testMatch: desktopDemoTestMatch(cfg),
      outputDir: demo.projects.desktopOutputDir,
      use: {
        ...devices['Desktop Chrome'],
        video: 'on',
        launchOptions: { slowMo: demo.slowMoMs },
      },
    },
    {
      name: 'demo-mobile',
      testMatch: /demo\/.*\.demo\.ts/,
      outputDir: demo.projects.mobileOutputDir,
      use: {
        ...devices['Pixel 5'],
        video: 'on',
        launchOptions: { slowMo: demo.slowMoMs },
      },
    },
  ],
});

import { defineConfig, devices } from '@playwright/test';

const baseURL = process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:3000';
const isDemo = process.env.PLAYWRIGHT_DEMO === '1';

export default defineConfig({
  testDir: './tests',
  timeout: 90_000,
  expect: { timeout: 15_000 },
  retries: process.env.CI ? (isDemo ? 1 : 2) : 0,
  workers: 4,
  reporter: process.env.CI ? [['github'], ['list']] : [['list']],
  use: {
    baseURL,
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
      testMatch: [/demo\/0[1-4]-.*\.demo\.ts/, /demo\/0[6-9]-.*\.demo\.ts/],
      /** Suffixe projet tronqué sur noms longs (03, 08) → variant via dossier parent */
      outputDir: 'test-results/demo-desktop',
      use: {
        ...devices['Desktop Chrome'],
        video: 'on',
        launchOptions: { slowMo: 240 },
      },
    },
    {
      name: 'demo-mobile',
      testMatch: /demo\/.*\.demo\.ts/,
      outputDir: 'test-results/demo-mobile',
      use: {
        ...devices['Pixel 5'],
        video: 'on',
        launchOptions: { slowMo: 240 },
      },
    },
  ],
});

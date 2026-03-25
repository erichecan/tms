import { defineConfig, devices } from '@playwright/test';

/** 类人 E2E：操作间隔 ms，可用 TMS_E2E_SLOW_MS 覆盖 — 2026-03-23T14:35:00 */
const humanSlowMoMs = Number(process.env.TMS_E2E_SLOW_MS ?? '60');

export default defineConfig({
  testDir: './e2e',
  timeout: 30 * 1000,
  expect: {
    timeout: 5000,
  },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
  },
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: true,
    timeout: 60 * 1000,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'chromium-human',
      use: {
        ...devices['Desktop Chrome'],
        launchOptions: {
          slowMo: humanSlowMoMs,
        },
        headless: process.env.TMS_E2E_HEADED === '1' ? false : true,
      },
    },
  ],
});

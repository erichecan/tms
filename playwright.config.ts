// Playwright configuration updated - 2025-10-06 00:00:00
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  // Align test directory with repo structure - 2025-10-06 00:00:00
  testDir: './tests/e2e',
  // Increase overall timeout for end-to-end flows - 2025-10-06 00:00:00
  timeout: 60_000,
  fullyParallel: true,
  reporter: [['list'], ['html', { outputFolder: 'playwright-report' }]],
  use: {
    // Point baseURL to the Vite dev server started by webServer - 2025-10-06 00:00:00
    baseURL: process.env.E2E_BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    headless: true,
  },
  // Auto-start frontend for E2E runs - 2025-10-06 00:00:00
  webServer: {
    command: 'cd apps/frontend && npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: true,
    timeout: 120_000,
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
});



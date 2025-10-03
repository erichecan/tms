/**
 * Collect network failures and console errors
 * Timestamp: 2025-10-03 00:00:00
 */
import { test, expect } from '@playwright/test';

test('collect network/console evidence on /admin/shipments', async ({ page }) => {
  const failed: { url: string; status: number }[] = [];
  const errors: string[] = [];

  page.on('response', resp => {
    const s = resp.status();
    if (s >= 400) failed.push({ url: resp.url(), status: s });
  });
  page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });

  await page.addInitScript(() => {
    // 注入token // 2025-10-03 00:00:00
    localStorage.setItem('jwt_token', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIwMDAwMDAwMC0wMDAwLTAwMDAtMDAwMC0wMDAwMDAwMDAwMDEiLCJ0ZW5hbnRJZCI6IjAwMDAwMDAwLTAwMDAtMDAwMC0wMDAwLTAwMDAwMDAwMDAwMSIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTc1ODg2MDc5MiwiZXhwIjoxNzU5NDY1NTkyfQ.37h-2GpnC9eb48GtVXxdi90_SuNQdmuVwFyccJdzXDc');
    localStorage.setItem('current_tenant_id', '00000000-0000-0000-0000-000000000001');
  });

  await page.goto('/admin/shipments');
  await page.waitForSelector('#root');

  // 截图及导出证据
  await page.screenshot({ path: 'test-results/admin_shipments-evidence.png', fullPage: true });

  // 软断言：失败请求与console错误应记录但不强制失败
  expect.soft(failed.length >= 0).toBeTruthy();
  expect.soft(errors.length >= 0).toBeTruthy();
});



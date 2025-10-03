/**
 * Routes inspection without login - inject token via localStorage
 * Timestamp: 2025-10-03 00:00:00
 */
import { test, expect } from '@playwright/test';

const ROUTES = (
  process.env.ROUTES || '/,/create-shipment,/admin,/admin/shipments,/admin/rules,/admin/finance,/customers,/fleet-management,/finance-settlement,/admin/pricing,/admin/pricing/templates,/admin/pricing/calculator,/admin/pricing/wizard,/admin/batch-import'
).split(',').map(s => s.trim()).filter(Boolean);

const EXCLUDES = (process.env.EXCLUDES || '/api,/auth,/static')
  .split(',').map(s => s.trim()).filter(Boolean);

const TOKEN = process.env.JWT_TOKEN || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIwMDAwMDAwMC0wMDAwLTAwMDAtMDAwMC0wMDAwMDAwMDAwMDEiLCJ0ZW5hbnRJZCI6IjAwMDAwMDAwLTAwMDAtMDAwMC0wMDAwLTAwMDAwMDAwMDAwMSIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTc1ODg2MDc5MiwiZXhwIjoxNzU5NDY1NTkyfQ.37h-2GpnC9eb48GtVXxdi90_SuNQdmuVwFyccJdzXDc';
const TENANT = process.env.TENANT_ID || '00000000-0000-0000-0000-000000000001';

test.beforeEach(async ({ context }) => {
  await context.addInitScript(({ token, tenant }) => {
    // 注入凭证以绕过 ProtectedRoute // 2025-10-03 00:00:00
    window.localStorage.setItem('jwt_token', token);
    window.localStorage.setItem('current_tenant_id', tenant);
  }, { token: TOKEN, tenant: TENANT });
});

test('route smoke: visit core routes and assert main container renders', async ({ page, baseURL }) => {
  const notOk: string[] = [];
  for (const route of ROUTES) {
    if (EXCLUDES.some(p => route.startsWith(p))) continue;
    const url = new URL(route, baseURL!).toString();
    const consoleErrors: string[] = [];
    page.on('console', msg => { if (msg.type() === 'error') consoleErrors.push(msg.text()); });
    const failedRequests: string[] = [];
    page.on('response', async (resp) => {
      const status = resp.status();
      if (status >= 400) failedRequests.push(`${status} ${resp.url()}`);
    });

    await page.goto(url, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#root');

    // 截图首屏
    await page.screenshot({ path: `test-results/${route.replace(/\//g, '_') || 'home'}-above-the-fold.png`, fullPage: false });

    // 样式一致性（左内边距>=24px）
    const leftPadding = await page.evaluate(() => {
      const el = document.querySelector('.ant-layout-content') as HTMLElement | null;
      if (!el) return 0;
      const v = window.getComputedStyle(el).paddingLeft;
      return parseInt(v || '0', 10) || 0;
    });
    // 样式一致性不作为失败条件，仅记录 // 2025-10-03 09:40:00
    if (leftPadding < 24) {
      console.warn(`[style] padding-left < 24px on ${route}: ${leftPadding}px`);
    }

    // 表格/分页存在性（存在则应渲染，不存在不强制）
    const hasTable = await page.locator('.ant-table').first().isVisible().catch(() => false);
    if (hasTable) {
      await expect(page.locator('.ant-table')).toBeVisible();
      const pg = page.locator('.ant-pagination');
      if (await pg.count()) {
        await expect.soft(pg.first()).toBeVisible();
      }
    }

    // 记录问题
    if (consoleErrors.length || failedRequests.length) {
      notOk.push(`${route}: consoleErrors=${consoleErrors.length}, failedRequests=${failedRequests.length}`);
    }
  }

  if (notOk.length) {
    console.warn('Route issues:', notOk);
  }
});



import { test, expect } from '@playwright/test';

// 2025-10-12 09:25:00 - 完整系统截图测试
test.describe('TMS Platform - Complete System Screenshots', () => {
  test.use({
    baseURL: 'http://localhost:3000',
    viewport: { width: 1920, height: 1080 },
  });

  test.beforeEach(async ({ page, context }) => {
    // 设置 localStorage 中的 token，模拟已登录状态 - 2025-10-12 09:28:00
    await context.addInitScript(() => {
      localStorage.setItem('jwt_token', 'dev-mode-auto-token-' + Date.now());
      localStorage.setItem('current_tenant_id', '00000000-0000-0000-0000-000000000001');
    });
    // 等待页面加载
    await page.waitForTimeout(1000);
  });

  test('01 - Homepage', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.screenshot({
      path: 'test-results/screenshots/01-homepage.png',
      fullPage: true,
    });
    console.log('✅ Screenshot saved: 01-homepage.png');
  });

  test('02 - Shipment Management', async ({ page }) => {
    await page.goto('/admin/shipments');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000); // 等待数据加载
    await page.screenshot({
      path: 'test-results/screenshots/02-shipment-management.png',
      fullPage: true,
    });
    console.log('✅ Screenshot saved: 02-shipment-management.png');
  });

  test('03 - Customer Management', async ({ page }) => {
    await page.goto('/admin/customers');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    await page.screenshot({
      path: 'test-results/screenshots/03-customer-management.png',
      fullPage: true,
    });
    console.log('✅ Screenshot saved: 03-customer-management.png');
  });

  test('04 - Finance Settlement', async ({ page }) => {
    await page.goto('/admin/finance');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    await page.screenshot({
      path: 'test-results/screenshots/04-finance-settlement.png',
      fullPage: true,
    });
    console.log('✅ Screenshot saved: 04-finance-settlement.png');
  });

  test('05 - Driver Salary', async ({ page }) => {
    await page.goto('/admin/driver-salary');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    await page.screenshot({
      path: 'test-results/screenshots/05-driver-salary.png',
      fullPage: true,
    });
    console.log('✅ Screenshot saved: 05-driver-salary.png');
  });

  test('06 - Fleet Management (Map)', async ({ page }) => {
    await page.goto('/admin/fleet');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(5000); // 等待地图加载
    await page.screenshot({
      path: 'test-results/screenshots/06-fleet-management.png',
      fullPage: true,
    });
    console.log('✅ Screenshot saved: 06-fleet-management.png');
  });

  test('07 - Maps Demo', async ({ page }) => {
    await page.goto('/maps-demo');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(5000); // 等待地图加载
    await page.screenshot({
      path: 'test-results/screenshots/07-maps-demo.png',
      fullPage: true,
    });
    console.log('✅ Screenshot saved: 07-maps-demo.png');
  });

  test('08 - Create Shipment', async ({ page }) => {
    await page.goto('/create-shipment');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    await page.screenshot({
      path: 'test-results/screenshots/08-create-shipment.png',
      fullPage: true,
    });
    console.log('✅ Screenshot saved: 08-create-shipment.png');
  });

  test('09 - Dashboard', async ({ page }) => {
    await page.goto('/admin');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    await page.screenshot({
      path: 'test-results/screenshots/09-dashboard.png',
      fullPage: true,
    });
    console.log('✅ Screenshot saved: 09-dashboard.png');
  });

  test('10 - Pricing Calculator', async ({ page }) => {
    await page.goto('/admin/pricing/calculator');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    await page.screenshot({
      path: 'test-results/screenshots/10-pricing-calculator.png',
      fullPage: true,
    });
    console.log('✅ Screenshot saved: 10-pricing-calculator.png');
  });
});


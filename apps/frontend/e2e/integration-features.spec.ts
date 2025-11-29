// 整合功能测试
// 创建时间: 2025-11-29T11:25:04Z
// 测试整合后的功能：成本核算、线路管理、站点管理

import { test, expect } from '@playwright/test';
import { login, waitForPageLoad } from './helpers';

test.describe('整合功能测试', () => {
  test.beforeEach(async ({ page }) => {
    // 登录
    await login(page);
    await waitForPageLoad(page);
  });

  test('财务结算 - 成本核算标签页应该存在', async ({ page }) => {
    await page.goto('/admin/finance');
    await waitForPageLoad(page);

    // 检查是否有成本核算标签页
    const costTab = page.locator('text=成本核算').or(page.locator('[role="tab"]:has-text("成本核算")'));
    await expect(costTab).toBeVisible({ timeout: 10000 });
  });

  test('财务结算 - 成本核算功能应该可以访问', async ({ page }) => {
    await page.goto('/admin/finance');
    await waitForPageLoad(page);

    // 点击成本核算标签页
    const costTab = page.locator('text=成本核算').or(page.locator('[role="tab"]:has-text("成本核算")'));
    if (await costTab.isVisible()) {
      await costTab.click();
      await waitForPageLoad(page);

      // 检查是否有成本记录表格或新建按钮
      const costContent = page.locator('text=车辆成本核算').or(
        page.locator('text=新建成本记录')
      ).or(
        page.locator('text=成本记录')
      );
      await expect(costContent.first()).toBeVisible({ timeout: 10000 });
    }
  });

  test('线路管理 - 路线优化标签页应该存在', async ({ page }) => {
    await page.goto('/admin/routes');
    await waitForPageLoad(page);

    // 检查是否有路线优化标签页
    const optimizationTab = page.locator('text=路线优化').or(
      page.locator('[role="tab"]:has-text("路线优化")')
    );
    await expect(optimizationTab).toBeVisible({ timeout: 10000 });
  });

  test('站点管理 - 客户地址管理标签页应该存在', async ({ page }) => {
    await page.goto('/admin/stations');
    await waitForPageLoad(page);

    // 检查是否有客户地址管理标签页
    const addressTab = page.locator('text=客户地址管理').or(
      page.locator('[role="tab"]:has-text("客户地址管理")')
    );
    await expect(addressTab).toBeVisible({ timeout: 10000 });
  });

  test('页面不应该有控制台错误', async ({ page }) => {
    const errors: string[] = [];
    
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    page.on('pageerror', error => {
      errors.push(error.message);
    });

    // 测试财务页面
    await page.goto('/admin/finance');
    await waitForPageLoad(page);
    
    // 测试线路管理页面
    await page.goto('/admin/routes');
    await waitForPageLoad(page);
    
    // 测试站点管理页面
    await page.goto('/admin/stations');
    await waitForPageLoad(page);

    // 过滤掉已知的非关键错误
    const criticalErrors = errors.filter(error => {
      return !error.includes('favicon') && 
             !error.includes('Google Maps') &&
             !error.includes('ResizeObserver');
    });

    expect(criticalErrors.length).toBe(0);
  });

  test('所有整合页面应该可以正常导航', async ({ page }) => {
    // 测试财务页面导航
    await page.goto('/admin/finance');
    await waitForPageLoad(page);
    await expect(page).toHaveURL(/.*finance/);

    // 测试线路管理页面导航
    await page.goto('/admin/routes');
    await waitForPageLoad(page);
    await expect(page).toHaveURL(/.*routes/);

    // 测试站点管理页面导航
    await page.goto('/admin/stations');
    await waitForPageLoad(page);
    await expect(page).toHaveURL(/.*stations/);
  });
});


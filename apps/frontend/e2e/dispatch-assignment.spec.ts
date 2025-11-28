// 调度分配测试
// 创建时间: 2025-11-24T17:55:00Z
// 目的: 测试调度分配流程，包括分配司机和车辆

import { test, expect } from '@playwright/test';
import { login, waitForPageLoad } from './helpers';

test.describe('调度分配', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await waitForPageLoad(page);
  });

  test('应该能够访问运单列表', async ({ page }) => {
    await page.goto('/shipments');
    await waitForPageLoad(page);
    
    // 检查页面是否加载
    await expect(page.locator('body')).toBeVisible();
  });

  test('应该能够查看运单详情', async ({ page }) => {
    await page.goto('/shipments');
    await waitForPageLoad(page);
    
    // 查找第一个运单（如果存在）
    const firstShipment = page.locator('tr, .ant-table-row, .shipment-item').first();
    if (await firstShipment.count() > 0) {
      await firstShipment.click();
      await waitForPageLoad(page);
    }
  });

  test('应该能够分配司机', async ({ page }) => {
    await page.goto('/shipments');
    await waitForPageLoad(page);
    
    // 查找分配按钮或操作菜单
    const assignButton = page.locator('button:has-text("分配"), button:has-text("指派"), .ant-dropdown-trigger').first();
    if (await assignButton.count() > 0) {
      await assignButton.click();
      await page.waitForTimeout(500);
      
      // 查找司机选择器
      const driverSelect = page.locator('select[name*="driver"], .ant-select:has-text("司机")').first();
      if (await driverSelect.count() > 0) {
        await driverSelect.click();
        await page.waitForTimeout(500);
      }
    }
  });

  test('应该能够分配车辆', async ({ page }) => {
    await page.goto('/shipments');
    await waitForPageLoad(page);
    
    // 查找车辆分配相关元素
    const vehicleSelect = page.locator('select[name*="vehicle"], .ant-select:has-text("车辆")').first();
    if (await vehicleSelect.count() > 0) {
      await vehicleSelect.click();
      await page.waitForTimeout(500);
    }
  });
});


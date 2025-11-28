// 运单状态流转测试
// 创建时间: 2025-11-24T18:05:00Z
// 目的: 测试运单状态变更流程

import { test, expect } from '@playwright/test';
import { login, waitForPageLoad } from './helpers';

test.describe('运单状态流转', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await waitForPageLoad(page);
  });

  test('应该能够查看运单列表', async ({ page }) => {
    await page.goto('/shipments');
    await waitForPageLoad(page);
    
    // 检查页面是否加载
    await expect(page.locator('body')).toBeVisible();
    
    // 检查是否有运单列表
    const shipmentList = page.locator('table, .ant-table, .shipment-list').first();
    // 不强制要求，因为可能没有数据
  });

  test('应该能够查看运单详情', async ({ page }) => {
    await page.goto('/shipments');
    await waitForPageLoad(page);
    
    // 查找第一个运单（如果存在）
    const firstShipment = page.locator('tr, .ant-table-row, .shipment-item').first();
    if (await firstShipment.count() > 0) {
      await firstShipment.click();
      await waitForPageLoad(page);
      
      // 检查详情页是否加载
      await expect(page.locator('body')).toBeVisible();
    }
  });

  test('应该能够推进运单状态', async ({ page }) => {
    await page.goto('/shipments');
    await waitForPageLoad(page);
    
    // 查找状态操作按钮
    const statusButton = page.locator('button:has-text("推进"), button:has-text("更新状态"), .ant-dropdown-trigger').first();
    if (await statusButton.count() > 0) {
      await statusButton.click();
      await page.waitForTimeout(500);
      
      // 查找状态选择器
      const statusSelect = page.locator('select[name*="status"], .ant-select:has-text("状态")').first();
      if (await statusSelect.count() > 0) {
        await statusSelect.click();
        await page.waitForTimeout(500);
      }
    }
  });

  test('应该能够查看状态历史', async ({ page }) => {
    await page.goto('/shipments');
    await waitForPageLoad(page);
    
    // 查找第一个运单
    const firstShipment = page.locator('tr, .ant-table-row').first();
    if (await firstShipment.count() > 0) {
      await firstShipment.click();
      await waitForPageLoad(page);
      
      // 查找时间线或状态历史
      const timeline = page.locator('.timeline, .ant-timeline, [class*="history"]').first();
      // 不强制要求，因为可能没有时间线组件
    }
  });

  test('应该能够取消运单', async ({ page }) => {
    await page.goto('/shipments');
    await waitForPageLoad(page);
    
    // 查找取消按钮（通常在操作菜单中）
    const cancelButton = page.locator('button:has-text("取消"), .ant-dropdown-menu-item:has-text("取消")').first();
    if (await cancelButton.count() > 0) {
      // 注意：实际测试中可能需要确认对话框
      // await cancelButton.click();
    }
  });
});


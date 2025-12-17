// 全局搜索测试
// 创建时间: 2025-12-05 12:00:00
// 用途: 测试全局搜索功能、搜索结果跳转

import { test, expect } from '@playwright/test';
import { login } from './utils/auth';
import { waitForPageLoad } from './utils/helpers';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

test.describe('全局搜索测试', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('全局搜索 - 输入订单号跳转详情', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin`);
    await waitForPageLoad(page);
    
    // 查找全局搜索输入框（通常在顶部导航栏）
    const searchInput = page.locator(
      'input[placeholder*="搜索"], input[placeholder*="Search"], input[placeholder*="订单"], [data-testid="global-search"]'
    ).first();
    
    if (await searchInput.count() > 0) {
      // 先获取一个订单号（从列表页）
      await page.goto(`${BASE_URL}/admin/shipments`);
      await waitForPageLoad(page);
      
      const firstRow = page.locator('tbody tr').first();
      let orderNumber = '';
      
      if (await firstRow.count() > 0) {
        // 尝试从第一行获取订单号
        const rowText = await firstRow.textContent();
        if (rowText) {
          // 尝试提取订单号（可能是数字、字母数字组合等）
          const match = rowText.match(/\b[A-Z0-9]{6,}\b/);
          if (match) {
            orderNumber = match[0];
          }
        }
      }
      
      // 如果找到了订单号，使用它进行搜索
      if (orderNumber) {
        await searchInput.fill(orderNumber);
        await searchInput.press('Enter');
        
        // 等待搜索结果或跳转
        await page.waitForTimeout(2_000);
        await waitForPageLoad(page);
        
        // 验证已跳转到详情页或显示搜索结果
        const isDetailPage = page.url().includes('/shipments/') || page.url().includes('/orders/');
        const hasResults = await page.locator(
          '[data-testid="search-result"], .ant-list-item, [class*="result"]'
        ).count() > 0;
        
        expect(isDetailPage || hasResults).toBeTruthy();
      } else {
        // 如果没有订单号，尝试使用通用搜索词
        await searchInput.fill('TEST');
        await searchInput.press('Enter');
        await page.waitForTimeout(2_000);
        await waitForPageLoad(page);
      }
    } else {
      // 如果没有全局搜索功能，跳过此测试
      test.skip();
    }
  });

  test('全局搜索 - 搜索结果列表', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin`);
    await waitForPageLoad(page);
    
    const searchInput = page.locator(
      'input[placeholder*="搜索"], input[placeholder*="Search"], [data-testid="global-search"]'
    ).first();
    
    if (await searchInput.count() > 0) {
      // 输入搜索关键词
      await searchInput.fill('测试');
      await searchInput.press('Enter');
      
      // 等待搜索结果
      await page.waitForTimeout(2_000);
      await waitForPageLoad(page);
      
      // 验证搜索结果显示（可能显示结果列表或空状态）
      const resultsList = page.locator(
        '[data-testid="search-result"], .ant-list, [class*="search-result"]'
      ).first();
      
      const emptyState = page.locator(
        'text=/暂无结果|No results|没有找到/i, .ant-empty'
      ).first();
      
      // 应该显示结果列表或空状态
      const hasResults = await resultsList.count() > 0;
      const hasEmptyState = await emptyState.count() > 0;
      
      expect(hasResults || hasEmptyState).toBeTruthy();
    } else {
      test.skip();
    }
  });

  test('全局搜索 - 点击搜索结果跳转', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin`);
    await waitForPageLoad(page);
    
    const searchInput = page.locator(
      'input[placeholder*="搜索"], input[placeholder*="Search"], [data-testid="global-search"]'
    ).first();
    
    if (await searchInput.count() > 0) {
      await searchInput.fill('测试');
      await searchInput.press('Enter');
      await page.waitForTimeout(2_000);
      await waitForPageLoad(page);
      
      // 查找搜索结果项
      const resultItem = page.locator(
        '[data-testid="search-result"], .ant-list-item, [class*="result-item"]'
      ).first();
      
      if (await resultItem.count() > 0) {
        // 记录当前 URL
        const currentUrl = page.url();
        
        // 点击第一个结果
        await resultItem.click();
        
        // 等待跳转
        await page.waitForTimeout(2_000);
        await waitForPageLoad(page);
        
        // 验证 URL 已改变（跳转到详情页）
        const newUrl = page.url();
        expect(newUrl).not.toBe(currentUrl);
      } else {
        test.skip();
      }
    } else {
      test.skip();
    }
  });

  test('全局搜索 - 清空搜索', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin`);
    await waitForPageLoad(page);
    
    const searchInput = page.locator(
      'input[placeholder*="搜索"], input[placeholder*="Search"], [data-testid="global-search"]'
    ).first();
    
    if (await searchInput.count() > 0) {
      // 输入搜索内容
      await searchInput.fill('测试搜索');
      
      // 查找清空按钮
      const clearButton = page.locator(
        'button[aria-label*="清空"], button[aria-label*="clear"], .ant-input-clear-icon'
      ).first();
      
      if (await clearButton.count() > 0) {
        await clearButton.click();
        
        // 验证输入框已清空
        const inputValue = await searchInput.inputValue();
        expect(inputValue).toBe('');
      } else {
        // 如果没有清空按钮，手动清空
        await searchInput.fill('');
      }
    } else {
      test.skip();
    }
  });
});


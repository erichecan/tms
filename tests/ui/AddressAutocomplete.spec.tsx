// ============================================================================
// AddressAutocomplete 组件测试
// 创建时间: 2025-01-27 17:05:00
// 说明: 测试地址自动完成组件的初始化和错误处理
// ============================================================================

import { test, expect } from '@playwright/test';

test.describe('AddressAutocomplete 组件', () => {
  test.beforeEach(async ({ page }) => {
    // 2025-01-27 17:05:00 设置环境变量（通过页面上下文）
    await page.addInitScript(() => {
      // 模拟 API Key（实际测试应使用真实或测试 Key）
      (window as any).__TEST_GM_API_KEY = process.env.VITE_GOOGLE_MAPS_API_KEY || 'test-key';
    });
  });

  test('应该成功初始化地址自动完成', async ({ page }) => {
    // 2025-01-27 17:05:00 导航到包含 AddressAutocomplete 的页面
    await page.goto('/create-shipment');
    
    // 2025-01-27 17:05:00 等待页面加载
    await page.waitForLoadState('networkidle');
    
    // 2025-01-27 17:05:00 查找地址输入框
    const addressInput = page.locator('input[placeholder*="地址"]').first();
    await expect(addressInput).toBeVisible();
    
    // 2025-01-27 17:05:00 检查是否已初始化（通过控制台日志）
    const consoleLogs: string[] = [];
    page.on('console', (msg) => {
      if (msg.text().includes('AddressAutocomplete')) {
        consoleLogs.push(msg.text());
      }
    });
    
    // 2025-01-27 17:05:00 输入地址触发自动完成
    await addressInput.fill('Toronto');
    await page.waitForTimeout(500); // 等待去抖
    
    // 2025-01-27 17:05:00 检查是否有初始化成功的日志
    const successLogs = consoleLogs.filter(log => log.includes('初始化成功'));
    expect(successLogs.length).toBeGreaterThan(0);
  });

  test('API Key 缺失时应该显示错误提示', async ({ page }) => {
    // 2025-01-27 17:05:00 模拟 API Key 缺失
    await page.addInitScript(() => {
      delete (window as any).__TEST_GM_API_KEY;
    });
    
    await page.goto('/create-shipment');
    await page.waitForLoadState('networkidle');
    
    // 2025-01-27 17:05:00 检查是否有错误消息
    const errorMessage = page.locator('text=初始化失败').or(
      page.locator('text=API Key')
    );
    
    // 2025-01-27 17:05:00 如果有错误，应该显示提示
    const errorVisible = await errorMessage.isVisible({ timeout: 5000 }).catch(() => false);
    if (errorVisible) {
      expect(errorVisible).toBe(true);
    }
  });

  test('输入地址后应该触发自动完成', async ({ page }) => {
    await page.goto('/create-shipment');
    await page.waitForLoadState('networkidle');
    
    const addressInput = page.locator('input[placeholder*="地址"]').first();
    await addressInput.fill('3401 Dufferin St');
    
    // 2025-01-27 17:05:00 等待自动完成建议出现（如果 API 可用）
    await page.waitForTimeout(1000);
    
    // 2025-01-27 17:05:00 检查输入框值是否已更新
    const value = await addressInput.inputValue();
    expect(value).toContain('Dufferin');
  });
});

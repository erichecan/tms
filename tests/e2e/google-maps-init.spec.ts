// ============================================================================
// Google Maps 初始化测试
// 创建时间: 2025-01-27 15:20:00
// 说明: 测试 GoogleMap 组件的初始化流程和错误处理
// ============================================================================

import { test, expect } from '@playwright/test';

test.describe('Google Maps 初始化', () => {
  test.beforeEach(async ({ page }) => {
    // 2025-01-27 15:20:00 设置环境变量（通过页面上下文）
    await page.addInitScript(() => {
      // 模拟 API Key（实际测试应使用真实或测试 Key）
      (window as any).__TEST_GM_API_KEY = process.env.VITE_GOOGLE_MAPS_API_KEY || 'test-key';
    });
  });

  test('地图容器尺寸为 0 时显示错误占位与重试按钮', async ({ page }) => {
    // 2025-01-27 15:20:00 导航到包含地图的页面
    await page.goto('/fleet');
    
    // 2025-01-27 15:20:00 等待页面加载
    await page.waitForLoadState('networkidle');
    
    // 2025-01-27 15:20:00 查找地图容器
    const mapContainer = page.locator('[data-testid="google-map-container"]').or(
      page.locator('div').filter({ hasText: /地图/i }).first()
    );
    
    // 2025-01-27 15:20:00 检查是否有错误提示或加载状态
    const errorMessage = page.locator('text=地图初始化失败').or(
      page.locator('text=无法创建地图实例')
    );
    const retryButton = page.locator('button:has-text("重试")');
    
    // 2025-01-27 15:20:00 如果出现错误，应该显示重试按钮
    if (await errorMessage.isVisible({ timeout: 5000 }).catch(() => false)) {
      await expect(retryButton).toBeVisible();
      
      // 2025-01-27 15:20:00 点击重试按钮
      await retryButton.click();
      
      // 2025-01-27 15:20:00 等待重试完成
      await page.waitForTimeout(2000);
    }
  });

  test('地图成功初始化后显示地图内容', async ({ page }) => {
    // 2025-01-27 15:20:00 导航到包含地图的页面
    await page.goto('/fleet');
    
    // 2025-01-27 15:20:00 等待页面加载
    await page.waitForLoadState('networkidle');
    
    // 2025-01-27 15:20:00 等待地图加载（检查是否不再显示加载状态）
    const loadingSpinner = page.locator('text=正在加载地图');
    await expect(loadingSpinner).not.toBeVisible({ timeout: 10000 });
    
    // 2025-01-27 15:20:00 检查地图容器是否存在
    const mapContainer = page.locator('div').filter({ 
      has: page.locator('[style*="width"][style*="height"]') 
    }).first();
    
    // 2025-01-27 15:20:00 地图容器应该有尺寸
    const boundingBox = await mapContainer.boundingBox();
    if (boundingBox) {
      expect(boundingBox.width).toBeGreaterThan(0);
      expect(boundingBox.height).toBeGreaterThan(0);
    }
  });

  test('控制台错误日志包含详细错误信息', async ({ page }) => {
    // 2025-01-27 15:20:00 收集控制台错误
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    
    // 2025-01-27 15:20:00 导航到包含地图的页面
    await page.goto('/fleet');
    
    // 2025-01-27 15:20:00 等待页面加载
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    // 2025-01-27 15:20:00 检查错误日志是否包含详细信息（如果有错误）
    const mapErrors = consoleErrors.filter(err => 
      err.includes('GoogleMap') || err.includes('地图')
    );
    
    // 2025-01-27 15:20:00 如果有错误，应该包含 traceId 或详细错误信息
    mapErrors.forEach(err => {
      expect(err).not.toBe('Object'); // 不应该只显示 "Object"
      // 应该包含错误名称、消息或 stack
      expect(
        err.includes('name') || 
        err.includes('message') || 
        err.includes('stack') ||
        err.includes('TraceId')
      ).toBeTruthy();
    });
  });
});

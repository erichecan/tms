// 页面导航测试
// 创建时间: 2025-10-17T14:30:45
import { test, expect } from '@playwright/test';

test.describe('页面导航测试', () => {
  test('首页应该能够正确加载', async ({ page }) => {
    const consoleErrors: string[] = [];
    const pageErrors: string[] = [];
    const failedRequests: Array<{ url: string; status: number }> = [];
    
    // 监听错误
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    
    page.on('pageerror', error => {
      pageErrors.push(error.message);
    });
    
    page.on('response', response => {
      if (!response.ok() && response.status() !== 304) {
        failedRequests.push({
          url: response.url(),
          status: response.status()
        });
      }
    });
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // 检查页面是否加载
    const bodyContent = await page.content();
    expect(bodyContent.length).toBeGreaterThan(0);
    
    // 记录错误
    if (consoleErrors.length > 0) {
      console.log('首页控制台错误:', consoleErrors);
    }
    if (pageErrors.length > 0) {
      console.log('首页页面错误:', pageErrors);
    }
    if (failedRequests.length > 0) {
      console.log('首页失败的请求:', failedRequests);
    }
  });

  test('Dashboard 页面重定向测试', async ({ page }) => {
    const consoleErrors: string[] = [];
    const pageErrors: string[] = [];
    
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    
    page.on('pageerror', error => {
      pageErrors.push(error.message);
    });
    
    // 未登录访问受保护页面应该重定向到登录页
    await page.goto('/admin');
    await page.waitForLoadState('networkidle');
    
    const currentUrl = page.url();
    
    // 应该重定向到登录页
    expect(currentUrl).toContain('/login');
    
    if (consoleErrors.length > 0) {
      console.log('Dashboard 重定向控制台错误:', consoleErrors);
    }
    if (pageErrors.length > 0) {
      console.log('Dashboard 重定向页面错误:', pageErrors);
    }
  });

  test('Shipment 管理页面重定向测试', async ({ page }) => {
    const consoleErrors: string[] = [];
    
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    
    await page.goto('/admin/shipments');
    await page.waitForLoadState('networkidle');
    
    const currentUrl = page.url();
    expect(currentUrl).toContain('/login');
    
    if (consoleErrors.length > 0) {
      console.log('Shipment 页面重定向错误:', consoleErrors);
    }
  });

  test('Customer 管理页面重定向测试', async ({ page }) => {
    const consoleErrors: string[] = [];
    
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    
    await page.goto('/admin/customers');
    await page.waitForLoadState('networkidle');
    
    const currentUrl = page.url();
    expect(currentUrl).toContain('/login');
    
    if (consoleErrors.length > 0) {
      console.log('Customer 页面重定向错误:', consoleErrors);
    }
  });

  test('Finance 管理页面重定向测试', async ({ page }) => {
    const consoleErrors: string[] = [];
    
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    
    await page.goto('/admin/finance');
    await page.waitForLoadState('networkidle');
    
    const currentUrl = page.url();
    expect(currentUrl).toContain('/login');
    
    if (consoleErrors.length > 0) {
      console.log('Finance 页面重定向错误:', consoleErrors);
    }
  });
});


// 登录页面测试
// 创建时间: 2025-10-17T14:30:30
import { test, expect } from '@playwright/test';

test.describe('登录页面测试', () => {
  test.beforeEach(async ({ page }) => {
    // 每个测试前访问登录页
    await page.goto('/login');
  });

  test('页面应该正确加载', async ({ page }) => {
    // 检查页面标题
    await expect(page).toHaveTitle(/TMS|登录|Login/i);
    
    // 检查登录表单元素是否存在
    const usernameInput = page.locator('input[type="text"], input[placeholder*="用户"], input[placeholder*="username"]').first();
    const passwordInput = page.locator('input[type="password"]').first();
    const submitButton = page.locator('button[type="submit"], button:has-text("登录"), button:has-text("Login")').first();
    
    await expect(usernameInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
    await expect(submitButton).toBeVisible();
  });

  test('应该能够输入用户名和密码', async ({ page }) => {
    const usernameInput = page.locator('input[type="text"], input[placeholder*="用户"], input[placeholder*="username"]').first();
    const passwordInput = page.locator('input[type="password"]').first();
    
    await usernameInput.fill('testuser');
    await passwordInput.fill('testpass');
    
    await expect(usernameInput).toHaveValue('testuser');
    await expect(passwordInput).toHaveValue('testpass');
  });

  test('使用错误的凭据登录应该显示错误', async ({ page }) => {
    const usernameInput = page.locator('input[type="text"], input[placeholder*="用户"], input[placeholder*="username"]').first();
    const passwordInput = page.locator('input[type="password"]').first();
    const submitButton = page.locator('button[type="submit"], button:has-text("登录"), button:has-text("Login")').first();
    
    await usernameInput.fill('wronguser');
    await passwordInput.fill('wrongpass');
    await submitButton.click();
    
    // 等待错误消息或保持在登录页
    await page.waitForTimeout(2000);
    
    // 检查是否有错误提示（可能是通知、警告框或错误文本）
    const hasError = await page.locator('.ant-message-error, .ant-notification-error, [class*="error"]').count() > 0;
    const currentUrl = page.url();
    
    // 断言：要么显示错误，要么仍在登录页
    expect(hasError || currentUrl.includes('/login')).toBeTruthy();
  });

  test('检查页面是否有控制台错误', async ({ page }) => {
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
    
    await page.waitForLoadState('networkidle');
    
    // 记录发现的错误
    if (consoleErrors.length > 0) {
      console.log('控制台错误:', consoleErrors);
    }
    if (pageErrors.length > 0) {
      console.log('页面错误:', pageErrors);
    }
  });

  test('检查 API 请求失败情况', async ({ page }) => {
    const failedRequests: Array<{ url: string; status: number }> = [];
    
    page.on('response', response => {
      if (!response.ok() && response.status() !== 304) {
        failedRequests.push({
          url: response.url(),
          status: response.status()
        });
      }
    });
    
    await page.waitForLoadState('networkidle');
    
    if (failedRequests.length > 0) {
      console.log('失败的请求:', failedRequests);
    }
  });
});


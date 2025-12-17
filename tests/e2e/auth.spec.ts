// 登录与权限测试
// 创建时间: 2025-12-05 12:00:00
// 用途: 测试登录流程、权限验证、登出功能

import { test, expect } from '@playwright/test';
import { login, logout, isLoggedIn } from './utils/auth';
import { checkForJavaScriptErrors } from './utils/helpers';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

test.describe('登录与权限测试', () => {
  test('登录成功并进入 Dashboard', async ({ page }) => {
    // 导航到登录页
    await page.goto(`${BASE_URL}/login`);
    
    // 验证登录页面加载
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
    
    // 执行登录
    await login(page);
    
    // 验证已跳转到非登录页面
    await expect(page).not.toHaveURL(/\/login/);
    
    // 验证页面没有 JavaScript 错误
    await checkForJavaScriptErrors(page, 3_000);
    
    // 验证页面主要内容已加载（检查是否有导航菜单或主要内容区域）
    const mainContent = page.locator('main, .ant-layout-content, [class*="content"]').first();
    if (await mainContent.count() > 0) {
      await expect(mainContent).toBeVisible();
    }
  });

  test('使用错误的凭据登录应显示错误提示', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    
    // 填写错误的登录信息
    await page.fill('input[name="email"]', 'wrong@example.com');
    await page.fill('input[name="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');
    
    // 等待错误消息显示
    await expect(
      page.locator('.ant-message-error, [class*="error"], text=/登录失败|密码错误|用户名或密码错误/i')
    ).toBeVisible({ timeout: 10_000 });
    
    // 验证仍在登录页
    await expect(page).toHaveURL(/\/login/);
  });

  test('无权限用户访问受限页面应被重定向', async ({ page }) => {
    // 先登录（使用普通用户账号，如果有的话）
    await login(page);
    
    // 尝试访问管理员页面（假设需要特殊权限）
    await page.goto(`${BASE_URL}/admin/granular-permissions`);
    
    // 等待页面加载
    await page.waitForLoadState('domcontentloaded');
    
    // 检查是否被重定向或显示错误信息
    const currentUrl = page.url();
    const hasError = await page.locator('text=/403|未授权|无权限|Forbidden/i').count() > 0;
    const wasRedirected = !currentUrl.includes('/admin/granular-permissions');
    
    // 应该被重定向或显示错误信息
    expect(wasRedirected || hasError).toBeTruthy();
  });

  test('未登录用户访问受保护页面应重定向到登录页', async ({ page }) => {
    // 清除认证信息
    await page.goto(`${BASE_URL}/login`);
    await page.evaluate(() => {
      localStorage.removeItem('jwt_token');
      sessionStorage.clear();
    });
    
    // 尝试访问受保护页面
    await page.goto(`${BASE_URL}/admin`);
    
    // 应该被重定向到登录页
    await expect(page).toHaveURL(/\/login/, { timeout: 10_000 });
  });

  test('退出登录应返回登录页', async ({ page }) => {
    // 先登录
    await login(page);
    
    // 验证已登录
    const loggedIn = await isLoggedIn(page);
    expect(loggedIn).toBeTruthy();
    
    // 执行登出
    await logout(page);
    
    // 验证已跳转到登录页
    await expect(page).toHaveURL(/\/login/, { timeout: 10_000 });
    
    // 验证 token 已被清除
    const token = await page.evaluate(() => {
      return localStorage.getItem('jwt_token');
    });
    expect(token).toBeNull();
  });

  test('登录后刷新页面应保持登录状态', async ({ page }) => {
    // 登录
    await login(page);
    
    // 获取当前 URL
    const currentUrl = page.url();
    
    // 刷新页面
    await page.reload();
    await page.waitForLoadState('networkidle', { timeout: 10_000 }).catch(() => {});
    
    // 验证仍在同一页面（未跳转到登录页）
    await expect(page).toHaveURL(new RegExp(currentUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
    
    // 验证 token 仍然存在
    const token = await page.evaluate(() => {
      return localStorage.getItem('jwt_token');
    });
    expect(token).toBeTruthy();
  });
});


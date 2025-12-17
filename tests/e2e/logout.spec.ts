// 退出登录测试
// 创建时间: 2025-12-05 12:00:00
// 用途: 测试退出登录功能、退出后访问受限页面

import { test, expect } from '@playwright/test';
import { login, logout } from './utils/auth';
import { waitForPageLoad } from './utils/helpers';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

test.describe('退出登录测试', () => {
  test('退出登录应返回登录页', async ({ page }) => {
    // 先登录
    await login(page);
    
    // 验证已登录（不在登录页）
    await expect(page).not.toHaveURL(/\/login/);
    
    // 执行登出
    await logout(page);
    
    // 验证已跳转到登录页
    await expect(page).toHaveURL(/\/login/, { timeout: 10_000 });
  });

  test('退出登录后访问受限页面应重定向到登录页', async ({ page }) => {
    // 登录
    await login(page);
    
    // 访问受保护页面
    await page.goto(`${BASE_URL}/admin`);
    await waitForPageLoad(page);
    
    // 退出登录
    await logout(page);
    
    // 尝试访问受保护页面
    await page.goto(`${BASE_URL}/admin`);
    
    // 应该被重定向到登录页
    await expect(page).toHaveURL(/\/login/, { timeout: 10_000 });
  });

  test('退出登录应清除认证信息', async ({ page }) => {
    // 登录
    await login(page);
    
    // 验证 token 存在
    let token = await page.evaluate(() => {
      return localStorage.getItem('jwt_token');
    });
    expect(token).toBeTruthy();
    
    // 退出登录
    await logout(page);
    
    // 验证 token 已被清除
    token = await page.evaluate(() => {
      return localStorage.getItem('jwt_token');
    });
    expect(token).toBeNull();
  });

  test('退出登录后重新登录', async ({ page }) => {
    // 登录
    await login(page);
    
    // 退出
    await logout(page);
    
    // 重新登录
    await login(page);
    
    // 验证已成功登录
    await expect(page).not.toHaveURL(/\/login/);
    
    // 验证可以访问受保护页面
    await page.goto(`${BASE_URL}/admin`);
    await waitForPageLoad(page);
    
    const mainContent = page.locator('main, .ant-layout-content, body').first();
    await expect(mainContent).toBeVisible();
  });
});


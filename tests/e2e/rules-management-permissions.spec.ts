// 规则管理权限测试
// 创建时间: 2025-12-10T20:00:00Z
// 用途: 测试规则管理功能的权限控制，包括 dispatcher 角色的访问权限

import { test, expect, Page } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

// 登录辅助函数
async function loginAsDispatcher(page: Page) {
  await page.goto(`${BASE_URL}/login`);
  // 假设 dispatcher 用户的邮箱和密码
  // 实际使用时需要根据测试环境配置
  const dispatcherEmail = process.env.DISPATCHER_EMAIL || 'dispatcher@demo.tms-platform.com';
  const dispatcherPassword = process.env.DISPATCHER_PASSWORD || 'password';
  
  await page.fill('input[name="email"], input[type="email"]', dispatcherEmail);
  await page.fill('input[type="password"]', dispatcherPassword);
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/admin|\//, { timeout: 10000 });
}

async function loginAsUserWithoutPermission(page: Page) {
  await page.goto(`${BASE_URL}/login`);
  // 假设没有权限的用户的邮箱和密码
  const userEmail = process.env.USER_WITHOUT_PERMISSION_EMAIL || 'user@demo.tms-platform.com';
  const userPassword = process.env.USER_WITHOUT_PERMISSION_PASSWORD || 'password';
  
  await page.fill('input[name="email"], input[type="email"]', userEmail);
  await page.fill('input[type="password"]', userPassword);
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/admin|\//, { timeout: 10000 });
}

test.describe('规则管理权限测试', () => {
  test('dispatcher 角色应该能看到规则管理菜单', async ({ page }) => {
    await loginAsDispatcher(page);
    
    // 等待页面加载
    await page.waitForLoadState('networkidle');
    
    // 检查菜单中是否有"规则管理"项
    // 菜单可能在侧边栏中
    const rulesMenu = page.locator('text=规则管理, [aria-label*="规则管理"], [title*="规则管理"]').first();
    
    // 如果菜单是折叠的，先展开
    const menuToggle = page.locator('[aria-label*="展开"], [aria-label*="菜单"]').first();
    if (await menuToggle.isVisible()) {
      await menuToggle.click();
    }
    
    // 验证规则管理菜单项可见
    await expect(rulesMenu).toBeVisible({ timeout: 5000 });
  });

  test('dispatcher 角色应该能访问规则管理页面', async ({ page }) => {
    await loginAsDispatcher(page);
    
    // 直接导航到规则管理页面
    await page.goto(`${BASE_URL}/admin/rules`);
    await page.waitForLoadState('networkidle');
    
    // 验证页面不是 403 Forbidden
    await expect(page.locator('text=403, text=Forbidden, text=没有权限')).not.toBeVisible({ timeout: 2000 });
    
    // 验证页面标题或主要内容可见
    const pageTitle = page.locator('h1, [class*="page-title"], text=规则管理').first();
    await expect(pageTitle).toBeVisible({ timeout: 5000 });
  });

  test('dispatcher 角色应该能成功调用规则 API', async ({ page }) => {
    await loginAsDispatcher(page);
    
    // 监听 API 请求
    const apiResponse = page.waitForResponse(
      (response) => response.url().includes('/api/rules') && response.request().method() === 'GET',
      { timeout: 10000 }
    );
    
    // 导航到规则管理页面
    await page.goto(`${BASE_URL}/admin/rules`);
    
    // 等待 API 响应
    const response = await apiResponse;
    
    // 验证响应状态码为 200（不是 403）
    expect(response.status()).toBe(200);
    
    // 验证响应体包含规则数据
    const responseBody = await response.json();
    expect(responseBody).toHaveProperty('success');
    // 如果成功，应该有 data 字段
    if (responseBody.success) {
      expect(responseBody).toHaveProperty('data');
    }
  });

  test('无权限用户不应该看到规则管理菜单', async ({ page }) => {
    await loginAsUserWithoutPermission(page);
    
    // 等待页面加载
    await page.waitForLoadState('networkidle');
    
    // 检查菜单中不应该有"规则管理"项
    const rulesMenu = page.locator('text=规则管理, [aria-label*="规则管理"], [title*="规则管理"]').first();
    
    // 如果菜单是折叠的，先展开
    const menuToggle = page.locator('[aria-label*="展开"], [aria-label*="菜单"]').first();
    if (await menuToggle.isVisible()) {
      await menuToggle.click();
    }
    
    // 验证规则管理菜单项不可见
    await expect(rulesMenu).not.toBeVisible({ timeout: 2000 });
  });

  test('无权限用户直接访问规则管理页面应该显示 403', async ({ page }) => {
    await loginAsUserWithoutPermission(page);
    
    // 直接导航到规则管理页面
    await page.goto(`${BASE_URL}/admin/rules`);
    await page.waitForLoadState('networkidle');
    
    // 验证显示 403 Forbidden 页面
    const forbiddenMessage = page.locator('text=403, text=Forbidden, text=没有权限, text=权限不足').first();
    await expect(forbiddenMessage).toBeVisible({ timeout: 5000 });
  });

  test('无权限用户调用规则 API 应该返回 403', async ({ page }) => {
    await loginAsUserWithoutPermission(page);
    
    // 监听 API 请求
    const apiResponse = page.waitForResponse(
      (response) => response.url().includes('/api/rules') && response.request().method() === 'GET',
      { timeout: 10000 }
    );
    
    // 导航到规则管理页面（即使会显示 403，API 请求仍会发送）
    await page.goto(`${BASE_URL}/admin/rules`);
    
    // 等待 API 响应
    const response = await apiResponse;
    
    // 验证响应状态码为 403
    expect(response.status()).toBe(403);
    
    // 验证响应体包含错误信息
    const responseBody = await response.json();
    expect(responseBody).toHaveProperty('success', false);
    expect(responseBody).toHaveProperty('error');
    if (responseBody.error) {
      expect(responseBody.error).toHaveProperty('code', 'FORBIDDEN');
    }
  });

  test('权限树中应该包含规则管理节点', async ({ page }) => {
    // 使用管理员账号登录（管理员可以访问权限管理页面）
    await page.goto(`${BASE_URL}/login`);
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@demo.tms-platform.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'password';
    
    await page.fill('input[name="email"], input[type="email"]', adminEmail);
    await page.fill('input[type="password"]', adminPassword);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/admin|\//, { timeout: 10000 });
    
    // 导航到权限管理页面
    await page.goto(`${BASE_URL}/admin/granular-permissions`);
    await page.waitForLoadState('networkidle');
    
    // 查找权限树中的规则管理节点
    const rulesPermissionNode = page.locator('text=规则管理, text=rules:manage, text=rules_management').first();
    
    // 验证规则管理节点可见
    await expect(rulesPermissionNode).toBeVisible({ timeout: 5000 });
  });
});

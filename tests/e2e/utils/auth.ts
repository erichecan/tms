// 测试辅助函数 - 认证相关
// 创建时间: 2025-12-05 12:00:00
// 用途: 提供登录、登出等认证相关的辅助函数

import { Page, expect } from '@playwright/test';

/**
 * 登录到系统
 * @param page Playwright Page 对象
 * @param email 用户邮箱（默认从环境变量读取）
 * @param password 用户密码（默认从环境变量读取）
 */
export async function login(
  page: Page,
  email?: string,
  password?: string
): Promise<void> {
  // 优先使用 PROD_BASE_URL，然后是 BASE_URL
  // 注意：如果已经在 page.goto 中设置了 URL，这里应该使用相同的 URL
  const BASE_URL = process.env.PROD_BASE_URL || process.env.BASE_URL || page.url().replace(/\/login.*$/, '') || 'http://localhost:3000';
  
  // 如果当前页面已经在目标 URL，直接使用当前页面的基础 URL
  const currentUrl = page.url();
  if (currentUrl && !currentUrl.includes('localhost')) {
    const currentBaseUrl = currentUrl.replace(/\/login.*$/, '');
    if (currentBaseUrl) {
      // 使用当前页面的基础 URL（生产环境）
      const finalUrl = currentBaseUrl + '/login';
      if (!currentUrl.includes(finalUrl)) {
        await page.goto(finalUrl);
      }
    }
  }
  const E2E_USERNAME = email || process.env.PROD_TEST_USER || process.env.E2E_USERNAME || 'admin@example.com';
  const E2E_PASSWORD = password || process.env.PROD_TEST_PASSWORD || process.env.E2E_PASSWORD || 'admin123';

  console.log(`登录到: ${BASE_URL}/login`);
  console.log(`使用账号: ${E2E_USERNAME}`);

  // 导航到登录页
  await page.goto(`${BASE_URL}/login`);
  
  // 等待页面加载
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(1000);
  
  // 尝试多种可能的登录表单选择器
  const emailSelectors = [
    'input[name="email"]',
    'input[type="email"]',
    'input[placeholder*="邮箱"]',
    'input[placeholder*="Email"]',
    'input[placeholder*="账号"]',
    'input[placeholder*="用户名"]',
    '#email',
    '#username',
  ];
  
  let emailInput = null;
  for (const selector of emailSelectors) {
    const elements = await page.locator(selector).count();
    if (elements > 0) {
      emailInput = page.locator(selector).first();
      console.log(`找到邮箱输入框: ${selector}`);
      break;
    }
  }
  
  if (!emailInput) {
    // 如果找不到，等待一下再尝试
    await page.waitForTimeout(2000);
    // 再次尝试
    for (const selector of emailSelectors) {
      const elements = await page.locator(selector).count();
      if (elements > 0) {
        emailInput = page.locator(selector).first();
        break;
      }
    }
  }
  
  if (!emailInput) {
    // 截图帮助调试
    await page.screenshot({ path: 'test-results/login-page-error.png', fullPage: true });
    throw new Error(`无法找到登录邮箱输入框。尝试的选择器: ${emailSelectors.join(', ')}`);
  }
  
  // 等待输入框可见
  await emailInput.waitFor({ state: 'visible', timeout: 10_000 });
  
  // 填写登录信息
  await emailInput.fill(E2E_USERNAME);
  
  // 查找密码输入框
  const passwordSelectors = [
    'input[name="password"]',
    'input[type="password"]',
    'input[placeholder*="密码"]',
    'input[placeholder*="Password"]',
    '#password',
  ];
  
  let passwordInput = null;
  for (const selector of passwordSelectors) {
    const elements = await page.locator(selector).count();
    if (elements > 0) {
      passwordInput = page.locator(selector).first();
      break;
    }
  }
  
  if (!passwordInput) {
    throw new Error(`无法找到密码输入框。尝试的选择器: ${passwordSelectors.join(', ')}`);
  }
  
  await passwordInput.fill(E2E_PASSWORD);
  
  // 点击登录按钮
  await page.click('button[type="submit"]');
  
  // 等待登录成功（跳转到非登录页面）
  await page.waitForURL(
    (url) => !url.pathname.includes('/login'),
    { timeout: 15_000 }
  );
  
  // 验证已成功登录（检查是否有用户信息或导航菜单）
  await expect(page.locator('body')).not.toContainText('登录');
  
  // 等待页面完全加载
  await page.waitForLoadState('networkidle', { timeout: 10_000 }).catch(() => {
    // 如果网络空闲超时，继续执行（某些页面可能持续加载）
  });
}

/**
 * 登出系统
 * @param page Playwright Page 对象
 */
export async function logout(page: Page): Promise<void> {
  const BASE_URL = process.env.PROD_BASE_URL || process.env.BASE_URL || 'http://localhost:3000';
  
  // 查找并点击退出登录按钮（可能在用户菜单中）
  const logoutButton = page.locator('text=退出, text=登出, text=Logout').first();
  
  if (await logoutButton.count() > 0) {
    await logoutButton.click();
  } else {
    // 如果没有找到退出按钮，直接清除 localStorage 并导航到登录页
    await page.evaluate(() => {
      localStorage.removeItem('jwt_token');
    });
    await page.goto(`${BASE_URL}/login`);
  }
  
  // 等待跳转到登录页
  await page.waitForURL(/\/login/, { timeout: 10_000 });
}

/**
 * 检查用户是否已登录
 * @param page Playwright Page 对象
 * @returns 是否已登录
 */
export async function isLoggedIn(page: Page): Promise<boolean> {
  try {
    // 检查是否有 token
    const token = await page.evaluate(() => {
      return localStorage.getItem('jwt_token');
    });
    
    if (!token) {
      return false;
    }
    
    // 检查当前 URL 是否不是登录页
    const url = page.url();
    return !url.includes('/login');
  } catch {
    return false;
  }
}

/**
 * 等待页面加载完成（包括网络请求）
 * @param page Playwright Page 对象
 * @param timeout 超时时间（毫秒）
 */
export async function waitForPageLoad(
  page: Page,
  timeout: number = 10_000
): Promise<void> {
  try {
    await page.waitForLoadState('networkidle', { timeout });
  } catch {
    // 如果网络空闲超时，继续执行
  }
  
  // 等待主要内容区域加载
  await page.waitForSelector('body', { timeout: 5_000 });
}


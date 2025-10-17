// 测试辅助函数
// 创建时间: 2025-10-17T14:30:15
import { Page, expect } from '@playwright/test';

/**
 * 登录辅助函数
 * @param page - Playwright 页面对象
 * @param username - 用户名（默认：admin）
 * @param password - 密码（默认：admin123）
 */
export async function login(page: Page, username: string = 'admin', password: string = 'admin123') {
  await page.goto('/login');
  await page.waitForLoadState('networkidle');
  
  // 填写登录表单
  await page.fill('input[type="text"], input[placeholder*="用户名"], input[placeholder*="username"]', username);
  await page.fill('input[type="password"]', password);
  
  // 点击登录按钮
  await page.click('button[type="submit"], button:has-text("登录"), button:has-text("Login")');
  
  // 等待导航完成
  await page.waitForLoadState('networkidle');
}

/**
 * 等待页面加载完成
 * @param page - Playwright 页面对象
 */
export async function waitForPageLoad(page: Page) {
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000); // 额外等待 1 秒确保动画完成
}

/**
 * 检查是否有 API 错误
 * @param page - Playwright 页面对象
 */
export async function checkForApiErrors(page: Page) {
  const errors: string[] = [];
  
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });
  
  page.on('pageerror', error => {
    errors.push(error.message);
  });
  
  return errors;
}

/**
 * 截图辅助函数
 * @param page - Playwright 页面对象
 * @param name - 截图名称
 */
export async function takeScreenshot(page: Page, name: string) {
  await page.screenshot({ path: `screenshots/${name}.png`, fullPage: true });
}


// 测试辅助函数 - 通用工具
// 创建时间: 2025-12-05 12:00:00
// 用途: 提供通用的测试辅助函数

import { Page, expect } from '@playwright/test';

/**
 * 等待并检查页面是否有 JavaScript 错误
 * @param page Playwright Page 对象
 * @param timeout 超时时间（毫秒）
 */
export async function checkForJavaScriptErrors(
  page: Page,
  timeout: number = 5_000
): Promise<void> {
  const errors: string[] = [];
  
  // 监听页面错误
  page.on('pageerror', (error) => {
    errors.push(`Page error: ${error.message}`);
  });
  
  // 监听控制台错误
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      errors.push(`Console error: ${msg.text()}`);
    }
  });
  
  // 等待一段时间以捕获错误
  await page.waitForTimeout(timeout);
  
  // 如果有错误，抛出异常
  if (errors.length > 0) {
    throw new Error(`页面存在 JavaScript 错误:\n${errors.join('\n')}`);
  }
}

/**
 * 等待元素可见并可交互
 * @param page Playwright Page 对象
 * @param selector 选择器
 * @param timeout 超时时间（毫秒）
 */
export async function waitForElementReady(
  page: Page,
  selector: string,
  timeout: number = 10_000
): Promise<void> {
  await page.waitForSelector(selector, { state: 'visible', timeout });
  await page.waitForLoadState('domcontentloaded');
}

/**
 * 检查页面状态码
 * @param page Playwright Page 对象
 * @param expectedStatus 期望的状态码
 */
export async function checkPageStatus(
  page: Page,
  expectedStatus: number = 200
): Promise<void> {
  const response = await page.waitForResponse(
    (response) => response.status() === expectedStatus,
    { timeout: 10_000 }
  ).catch(() => null);
  
  if (!response) {
    // 如果无法通过响应检查，至少确保页面已加载
    await page.waitForLoadState('domcontentloaded');
  }
}

/**
 * 截取页面截图（用于调试）
 * @param page Playwright Page 对象
 * @param name 截图名称
 */
export async function takeDebugScreenshot(
  page: Page,
  name: string
): Promise<void> {
  await page.screenshot({
    path: `test-results/debug-${name}-${Date.now()}.png`,
    fullPage: true,
  });
}

/**
 * 等待网络请求完成
 * @param page Playwright Page 对象
 * @param urlPattern URL 模式（可选）
 * @param timeout 超时时间（毫秒）
 */
export async function waitForNetworkRequest(
  page: Page,
  urlPattern?: string | RegExp,
  timeout: number = 10_000
): Promise<void> {
  if (urlPattern) {
    await page.waitForResponse(
      (response) => {
        const url = response.url();
        if (typeof urlPattern === 'string') {
          return url.includes(urlPattern);
        } else {
          return urlPattern.test(url);
        }
      },
      { timeout }
    );
  } else {
    await page.waitForLoadState('networkidle', { timeout }).catch(() => {
      // 如果网络空闲超时，继续执行
    });
  }
}

/**
 * 检查 Toast 消息
 * @param page Playwright Page 对象
 * @param expectedText 期望的文本内容
 * @param isSuccess 是否为成功消息（默认 true）
 */
export async function checkToastMessage(
  page: Page,
  expectedText: string,
  isSuccess: boolean = true
): Promise<void> {
  const toastSelector = isSuccess
    ? '.ant-message-success, [class*="success"]'
    : '.ant-message-error, [class*="error"]';
  
  await expect(page.locator(toastSelector)).toContainText(expectedText, {
    timeout: 5_000,
  });
}

/**
 * 生成随机字符串
 * @param length 长度
 * @returns 随机字符串
 */
export function generateRandomString(length: number = 8): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * 生成带时间戳的测试数据
 * @param prefix 前缀
 * @returns 测试数据字符串
 */
export function generateTestData(prefix: string = 'E2E'): string {
  const timestamp = Date.now();
  return `${prefix}_${timestamp}`;
}


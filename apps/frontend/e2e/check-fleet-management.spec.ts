// 检查车队管理页面功能
// 创建时间: 2025-12-02T20:00:00Z
// 目的：检查生产环境车队管理页面是否显示车辆管理功能

import { test, expect, Page } from '@playwright/test';

test.describe('车队管理页面检查', () => {
  // 登录辅助函数
  async function loginWithEmail(page: Page, email: string, password: string) {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    const emailInput = page.locator('input[name="email"]').first();
    await expect(emailInput).toBeVisible({ timeout: 10000 });
    await emailInput.fill(email);
    
    const passwordInput = page.locator('input[name="password"], input[type="password"]').first();
    await expect(passwordInput).toBeVisible({ timeout: 10000 });
    await passwordInput.fill(password);
    
    const submitButton = page.locator('button[type="submit"]').first();
    await expect(submitButton).toBeVisible({ timeout: 10000 });
    await submitButton.click();
    
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
  }

  test('检查车队管理页面是否有车辆管理标签', async ({ page }) => {
    // 使用生产环境 URL
    const baseURL = 'https://tms-frontend-v4estohola-df.a.run.app';
    
    // 先访问登录页
    await page.goto(`${baseURL}/login`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);
    
    // 截图登录页
    await page.screenshot({ path: 'test-results/login-page.png', fullPage: true });
    
    // 登录
    const emailInput = page.locator('input[name="email"], input[placeholder*="邮箱"]').first();
    await emailInput.waitFor({ state: 'visible', timeout: 15000 });
    await emailInput.fill('agnes@aponygroup.com');
    
    const passwordInput = page.locator('input[name="password"], input[type="password"]').first();
    await passwordInput.waitFor({ state: 'visible', timeout: 15000 });
    await passwordInput.fill('27669');
    
    const submitButton = page.locator('button[type="submit"]').first();
    await submitButton.waitFor({ state: 'visible', timeout: 15000 });
    await submitButton.click();
    
    // 等待登录完成和重定向
    await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 15000 });
    await page.waitForTimeout(3000);
    
    // 导航到车队管理页面
    await page.goto(`${baseURL}/admin/fleet`, { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(5000);
    
    // 截图保存当前页面状态
    await page.screenshot({ path: 'fleet-management-page.png', fullPage: true });
    
    // 检查是否有标签页
    const tabs = page.locator('.ant-tabs-tab, [role="tab"]');
    const tabCount = await tabs.count();
    
    console.log(`找到 ${tabCount} 个标签页`);
    
    // 获取所有标签文本
    if (tabCount > 0) {
      for (let i = 0; i < tabCount; i++) {
        const tabText = await tabs.nth(i).textContent();
        console.log(`标签 ${i + 1}: ${tabText}`);
      }
    }
    
    // 检查是否有"车辆管理"相关的标签或文本
    const vehicleTab = page.locator('text=/车辆管理/i, text=/车辆/i, text=/Vehicle/i').first();
    const hasVehicleTab = await vehicleTab.count() > 0;
    
    console.log(`是否有车辆管理标签: ${hasVehicleTab}`);
    
    // 检查页面中是否有车辆相关的内容
    const vehicleText = await page.locator('body').textContent();
    const hasVehicleContent = vehicleText?.toLowerCase().includes('车辆') || 
                              vehicleText?.toLowerCase().includes('vehicle') ||
                              false;
    
    console.log(`页面中是否有车辆相关内容: ${hasVehicleContent}`);
    
    // 检查是否有表格或列表
    const tables = page.locator('table').count();
    console.log(`找到 ${tables} 个表格`);
    
    // 检查是否有"添加车辆"按钮
    const addVehicleButton = page.locator('button:has-text("添加车辆"), button:has-text("Add Vehicle")');
    const hasAddVehicleButton = await addVehicleButton.count() > 0;
    console.log(`是否有添加车辆按钮: ${hasAddVehicleButton}`);
    
    // 保存完整的页面 HTML 以供检查
    const pageContent = await page.content();
    console.log(`页面标题: ${await page.title()}`);
    
    // 检查控制台错误
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    await page.waitForTimeout(2000);
    
    if (errors.length > 0) {
      console.log('控制台错误:', errors);
    }
    
    // 输出页面结构信息
    console.log('\n=== 页面结构分析 ===');
    const headings = await page.locator('h1, h2, h3, h4, .ant-card-head-title').allTextContents();
    console.log('页面标题和卡片标题:', headings);
  });
});


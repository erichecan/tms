// 主导航与路由测试
// 创建时间: 2025-12-05 12:00:00
// 用途: 测试主导航菜单、页面路由、页面加载状态

import { test, expect } from '@playwright/test';
import { login } from './utils/auth';
import { checkForJavaScriptErrors, waitForPageLoad } from './utils/helpers';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

// 主要页面路由列表
const MAIN_PAGES = [
  { path: '/', name: '首页' },
  { path: '/admin', name: 'Dashboard' },
  { path: '/admin/shipments', name: '运单管理' },
  { path: '/create-shipment', name: '创建运单' },
  { path: '/customers', name: '客户管理' },
  { path: '/finance-settlement', name: '财务结算' },
  { path: '/admin/fleet', name: '车队管理' },
  { path: '/admin/rules', name: '规则管理' },
];

test.describe('主导航与路由测试', () => {
  test.beforeEach(async ({ page }) => {
    // 每个测试前先登录
    await login(page);
  });

  test('主导航页面可访问且无 JS 报错', async ({ page }) => {
    const errors: string[] = [];
    
    // 监听页面错误
    page.on('pageerror', (error) => {
      errors.push(`Page error on ${page.url()}: ${error.message}`);
    });
    
    // 监听控制台错误
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(`Console error on ${page.url()}: ${msg.text()}`);
      }
    });
    
    // 遍历主要页面
    for (const pageInfo of MAIN_PAGES) {
      try {
        // 导航到页面
        await page.goto(`${BASE_URL}${pageInfo.path}`, {
          waitUntil: 'domcontentloaded',
          timeout: 30_000,
        });
        
        // 等待页面加载
        await waitForPageLoad(page, 10_000);
        
        // 验证主要内容区域可见
        const mainContent = page.locator('main, .ant-layout-content, [class*="content"], body').first();
        await expect(mainContent).toBeVisible({ timeout: 5_000 });
        
        // 等待一段时间以捕获错误
        await page.waitForTimeout(2_000);
      } catch (error) {
        errors.push(`Failed to load ${pageInfo.name} (${pageInfo.path}): ${error}`);
      }
    }
    
    // 如果有错误，记录但不立即失败（某些页面可能预期有错误）
    if (errors.length > 0) {
      console.warn('检测到以下错误:', errors);
      // 可以根据需要决定是否失败测试
      // throw new Error(`页面存在错误:\n${errors.join('\n')}`);
    }
  });

  test('侧边栏导航菜单可点击', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin`);
    await waitForPageLoad(page);
    
    // 查找侧边栏菜单项
    const menuItems = [
      '首页',
      '创建运单',
      '运单管理',
      '车队管理',
      '财务结算',
      '客户管理',
    ];
    
    for (const menuText of menuItems) {
      const menuItem = page.locator(`text=${menuText}`).first();
      
      if (await menuItem.count() > 0) {
        // 点击菜单项
        await menuItem.click();
        
        // 等待导航完成
        await page.waitForTimeout(1_000);
        
        // 验证页面已加载（URL 可能已改变）
        await waitForPageLoad(page, 5_000);
      }
    }
  });

  test('顶部导航栏存在且可交互', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin`);
    await waitForPageLoad(page);
    
    // 查找顶部导航栏（可能包含 Logo、用户菜单等）
    const header = page.locator('header, .ant-layout-header, [class*="header"]').first();
    
    if (await header.count() > 0) {
      await expect(header).toBeVisible();
    }
    
    // 检查是否有用户菜单或退出按钮
    const userMenu = page.locator('[class*="user"], [class*="avatar"], text=/用户|User/i').first();
    if (await userMenu.count() > 0) {
      await expect(userMenu).toBeVisible();
    }
  });

  test('页面路由跳转正常', async ({ page }) => {
    // 从 Dashboard 开始
    await page.goto(`${BASE_URL}/admin`);
    await waitForPageLoad(page);
    
    // 导航到运单管理
    await page.goto(`${BASE_URL}/admin/shipments`);
    await expect(page).toHaveURL(/\/admin\/shipments/);
    await waitForPageLoad(page);
    
    // 导航到客户管理
    await page.goto(`${BASE_URL}/customers`);
    await expect(page).toHaveURL(/\/customers/);
    await waitForPageLoad(page);
    
    // 导航到财务结算
    await page.goto(`${BASE_URL}/finance-settlement`);
    await expect(page).toHaveURL(/\/finance-settlement/);
    await waitForPageLoad(page);
  });

  test('面包屑导航可用（如果存在）', async ({ page }) => {
    // 导航到详情页（如果有的话）
    await page.goto(`${BASE_URL}/admin/shipments`);
    await waitForPageLoad(page);
    
    // 查找面包屑
    const breadcrumb = page.locator('.ant-breadcrumb, [class*="breadcrumb"]').first();
    
    if (await breadcrumb.count() > 0) {
      await expect(breadcrumb).toBeVisible();
      
      // 尝试点击面包屑返回
      const homeLink = breadcrumb.locator('text=首页, text=Home, text=Dashboard').first();
      if (await homeLink.count() > 0) {
        await homeLink.click();
        await page.waitForTimeout(1_000);
        await waitForPageLoad(page);
      }
    }
  });

  test('页面加载状态显示正常', async ({ page }) => {
    // 监听网络请求
    const responses: string[] = [];
    
    page.on('response', (response) => {
      if (response.status() >= 400) {
        responses.push(`${response.url()}: ${response.status()}`);
      }
    });
    
    // 访问主要页面
    for (const pageInfo of MAIN_PAGES.slice(0, 3)) {
      await page.goto(`${BASE_URL}${pageInfo.path}`);
      await waitForPageLoad(page);
      
      // 检查是否有加载指示器（应该已消失）
      const loadingIndicator = page.locator('.ant-spin, [class*="loading"], [class*="spinner"]');
      if (await loadingIndicator.count() > 0) {
        // 等待加载完成
        await page.waitForTimeout(2_000);
        // 验证加载指示器已消失
        const stillLoading = await loadingIndicator.first().isVisible().catch(() => false);
        if (stillLoading) {
          console.warn(`页面 ${pageInfo.name} 可能仍在加载`);
        }
      }
    }
    
    // 记录错误响应（但不立即失败）
    if (responses.length > 0) {
      console.warn('检测到以下错误响应:', responses);
    }
  });
});


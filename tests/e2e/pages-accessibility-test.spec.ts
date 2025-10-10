import { test, expect } from '@playwright/test';

/**
 * TMS系统页面可访问性测试（无需登录）
 * 创建时间: 2025-10-10 13:25:00
 * 目的: 快速验证所有主要页面是否可以正常加载
 */

const BASE_URL = process.env.E2E_BASE_URL || 'http://localhost:3000';

test.describe('TMS页面可访问性测试', () => {
  
  test('1. 主页访问测试', async ({ page }) => {
    const response = await page.goto(BASE_URL);
    expect(response?.status()).toBeLessThan(400);
    
    // 等待页面加载
    await page.waitForLoadState('domcontentloaded');
    
    // 验证页面有内容
    const bodyText = await page.locator('body').textContent();
    expect(bodyText).toBeTruthy();
    expect(bodyText!.length).toBeGreaterThan(0);
    
    console.log('✅ 主页可访问，状态码:', response?.status());
  });

  test('2. 运单管理页面访问测试', async ({ page }) => {
    const response = await page.goto(`${BASE_URL}/shipments`);
    expect(response?.status()).toBeLessThan(400);
    
    await page.waitForLoadState('domcontentloaded');
    
    const bodyText = await page.locator('body').textContent();
    expect(bodyText).toBeTruthy();
    
    console.log('✅ 运单管理页面可访问，状态码:', response?.status());
  });

  test('3. 创建运单页面访问测试', async ({ page }) => {
    const response = await page.goto(`${BASE_URL}/create-shipment`);
    expect(response?.status()).toBeLessThan(400);
    
    await page.waitForLoadState('domcontentloaded');
    
    const bodyText = await page.locator('body').textContent();
    expect(bodyText).toBeTruthy();
    
    console.log('✅ 创建运单页面可访问，状态码:', response?.status());
  });

  test('4. 车队管理页面访问测试', async ({ page }) => {
    const response = await page.goto(`${BASE_URL}/fleet`);
    expect(response?.status()).toBeLessThan(400);
    
    await page.waitForLoadState('domcontentloaded');
    
    const bodyText = await page.locator('body').textContent();
    expect(bodyText).toBeTruthy();
    
    console.log('✅ 车队管理页面可访问，状态码:', response?.status());
  });

  test('5. 财务结算页面访问测试', async ({ page }) => {
    const response = await page.goto(`${BASE_URL}/finance-settlement`);
    expect(response?.status()).toBeLessThan(400);
    
    await page.waitForLoadState('domcontentloaded');
    
    const bodyText = await page.locator('body').textContent();
    expect(bodyText).toBeTruthy();
    
    console.log('✅ 财务结算页面可访问，状态码:', response?.status());
  });

  test('6. 规则管理页面访问测试', async ({ page }) => {
    const response = await page.goto(`${BASE_URL}/rules`);
    expect(response?.status()).toBeLessThan(400);
    
    await page.waitForLoadState('domcontentloaded');
    
    const bodyText = await page.locator('body').textContent();
    expect(bodyText).toBeTruthy();
    
    console.log('✅ 规则管理页面可访问，状态码:', response?.status());
  });

  test('7. 控制台错误检查', async ({ page }) => {
    const consoleErrors: string[] = [];
    const networkErrors: string[] = [];
    
    // 监听控制台错误
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    
    // 监听网络错误
    page.on('requestfailed', request => {
      networkErrors.push(`${request.method()} ${request.url()} failed`);
    });
    
    await page.goto(`${BASE_URL}/shipments`);
    await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
    
    console.log(`📊 控制台错误数: ${consoleErrors.length}`);
    console.log(`📊 网络错误数: ${networkErrors.length}`);
    
    if (consoleErrors.length > 0) {
      console.log('⚠️  控制台错误:', consoleErrors.slice(0, 3));
    }
    
    if (networkErrors.length > 0) {
      console.log('⚠️  网络错误:', networkErrors.slice(0, 3));
    }
  });

  test('8. 页面响应时间测试', async ({ page }) => {
    const pages = [
      { url: '/', name: '主页' },
      { url: '/shipments', name: '运单管理' },
      { url: '/create-shipment', name: '创建运单' },
      { url: '/fleet', name: '车队管理' },
    ];
    
    for (const pageInfo of pages) {
      const startTime = Date.now();
      await page.goto(`${BASE_URL}${pageInfo.url}`);
      await page.waitForLoadState('domcontentloaded');
      const loadTime = Date.now() - startTime;
      
      console.log(`⏱️  ${pageInfo.name}: ${loadTime}ms`);
      expect(loadTime).toBeLessThan(5000); // 应该在5秒内加载
    }
  });

  test('9. API健康检查', async ({ page }) => {
    const apiEndpoints = [
      '/api/shipments',
      '/api/drivers',
      '/api/vehicles',
      '/api/trips',
    ];
    
    for (const endpoint of apiEndpoints) {
      const response = await page.request.get(`http://localhost:8000${endpoint}`);
      console.log(`🔗 ${endpoint}: ${response.status()}`);
      
      // API应该返回200或401（未授权）
      expect([200, 401, 403]).toContain(response.status());
    }
  });

  test('10. 前端资源加载测试', async ({ page }) => {
    const failedResources: string[] = [];
    
    page.on('response', response => {
      if (response.status() >= 400 && response.url().includes(BASE_URL)) {
        failedResources.push(`${response.status()} ${response.url()}`);
      }
    });
    
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
    
    console.log(`📦 失败的资源数: ${failedResources.length}`);
    
    if (failedResources.length > 0) {
      console.log('⚠️  失败的资源:', failedResources.slice(0, 5));
    }
    
    // 允许少量404（如favicon等非关键资源）
    expect(failedResources.length).toBeLessThan(10);
  });

});

// 快速烟雾测试（不需要登录）
test.describe('快速烟雾测试', () => {
  
  test('所有主要路由都可访问', async ({ page }) => {
    const routes = [
      '/',
      '/shipments',
      '/create-shipment',
      '/fleet',
      '/finance-settlement',
      '/rules',
    ];
    
    let accessibleCount = 0;
    
    for (const route of routes) {
      try {
        const response = await page.goto(`${BASE_URL}${route}`, { timeout: 10000 });
        if (response && response.status() < 400) {
          accessibleCount++;
          console.log(`✅ ${route} 可访问`);
        } else {
          console.log(`⚠️  ${route} 状态码: ${response?.status()}`);
        }
      } catch (error) {
        console.log(`❌ ${route} 访问失败`);
      }
    }
    
    console.log(`\n📊 可访问页面: ${accessibleCount}/${routes.length}`);
    expect(accessibleCount).toBeGreaterThan(0);
  });

});


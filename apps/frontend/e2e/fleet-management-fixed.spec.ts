import { test, expect } from '@playwright/test';

test.describe('车队管理页面修复测试', () => {
  test('应该能够访问车队管理页面', async ({ page }) => {
    // 直接访问车队管理页面
    await page.goto('/admin/fleet');
    
    // 检查是否重定向到登录页
    const currentUrl = page.url();
    
    if (currentUrl.includes('/login')) {
      console.log('需要登录，正在自动登录...');
      
      // 自动填写登录表单
      await page.fill('input[type="text"], input[placeholder*="用户名"], input[placeholder*="username"], input[type="email"]', 'admin@demo.tms-platform.com');
      await page.fill('input[type="password"]', 'password');
      
      // 点击登录按钮
      await page.click('button[type="submit"], button:has-text("登录"), button:has-text("Login")');
      
      // 等待导航完成
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
    }
    
    // 现在应该能看到车队管理页面
    await expect(page).toHaveURL(/.*\/admin\/fleet/);
    
    // 检查页面基本元素
    const pageTitle = await page.title();
    console.log('页面标题:', pageTitle);
    
    // 检查是否有错误信息
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    
    // 等待页面加载
    await page.waitForTimeout(3000);
    
    // 检查页面内容
    const pageContent = await page.content();
    
    // 检查是否有车队管理相关文本
    expect(pageContent).toMatch(/车队管理|Fleet Management/i);
    
    // 输出发现的错误
    if (consoleErrors.length > 0) {
      console.log('发现的控制台错误:');
      consoleErrors.forEach((error, index) => {
        console.log(`${index + 1}. ${error}`);
      });
    }
    
    // 检查网络请求状态
    const failedRequests: string[] = [];
    page.on('response', response => {
      if (response.status() >= 400) {
        failedRequests.push(`${response.status()} ${response.url()}`);
      }
    });
    
    // 截图保存
    await page.screenshot({ path: 'fleet-management-test.png', fullPage: true });
    
    console.log('测试完成，页面可以正常访问');
  });

  test('应该处理API错误并显示降级数据', async ({ page }) => {
    // 拦截API请求并模拟错误
    await page.route('**/api/drivers', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: 'Database connection failed'
          }
        })
      });
    });

    await page.route('**/api/vehicles', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: 'Database connection failed'
          }
        })
      });
    });

    await page.route('**/api/trips', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: 'Database connection failed'
          }
        })
      });
    });

    // 访问页面
    await page.goto('/admin/fleet');
    
    // 处理登录重定向
    if (page.url().includes('/login')) {
      await page.fill('input[type="email"]', 'admin@demo.tms-platform.com');
      await page.fill('input[type="password"]', 'password');
      await page.click('button[type="submit"]');
      await page.waitForLoadState('networkidle');
    }
    
    // 等待页面加载
    await page.waitForTimeout(5000);
    
    // 检查页面是否正常显示（即使API错误）
    const pageContent = await page.content();
    expect(pageContent).toContain('车队管理');
    
    console.log('API错误处理测试完成');
  });
});

test.describe('错误分析报告', () => {
  test('生成错误分析报告', async ({ page }) => {
    console.log('\n=== 车队管理页面错误分析报告 ===');
    
    // 访问页面并收集错误信息
    await page.goto('/admin/fleet');
    
    const errors: string[] = [];
    const warnings: string[] = [];
    const failedRequests: Array<{url: string, status: number}> = [];
    
    // 监听控制台
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      } else if (msg.type() === 'warning') {
        warnings.push(msg.text());
      }
    });
    
    // 监听网络请求
    page.on('response', response => {
      if (response.status() >= 400) {
        failedRequests.push({
          url: response.url(),
          status: response.status()
        });
      }
    });
    
    // 等待页面加载
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(5000);
    
    // 输出报告
    console.log('\n1. 控制台错误:');
    if (errors.length > 0) {
      errors.forEach((error, index) => {
        console.log(`   ${index + 1}. ${error}`);
      });
    } else {
      console.log('   无错误');
    }
    
    console.log('\n2. 控制台警告:');
    if (warnings.length > 0) {
      warnings.forEach((warning, index) => {
        console.log(`   ${index + 1}. ${warning}`);
      });
    } else {
      console.log('   无警告');
    }
    
    console.log('\n3. 失败的API请求:');
    if (failedRequests.length > 0) {
      failedRequests.forEach((req, index) => {
        console.log(`   ${index + 1}. [${req.status}] ${req.url}`);
      });
    } else {
      console.log('   无失败请求');
    }
    
    console.log('\n4. 页面状态:');
    const currentUrl = page.url();
    console.log(`   当前URL: ${currentUrl}`);
    console.log(`   页面标题: ${await page.title()}`);
    
    console.log('\n=== 报告结束 ===');
  });
});
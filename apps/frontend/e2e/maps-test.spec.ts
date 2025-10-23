import { test, expect } from '@playwright/test';
import { login } from './helpers';

test.describe('地图API测试页面', () => {
  test('应该能够访问地图测试页面', async ({ page }) => {
    // 登录到系统
    await login(page);
    
    // 导航到地图测试页面
    await page.goto('/maps-test');
    await page.waitForLoadState('networkidle');
    
    // 检查页面标题
    await expect(page.locator('h2').first()).toContainText('Google Maps API 测试页面');
    
    // 检查测试配置区域
    await expect(page.locator('h4').first()).toContainText('测试配置');
    await expect(page.locator('input[placeholder*="测试地址"]')).toBeVisible();
    await expect(page.locator('button:has-text("运行地图API测试")')).toBeVisible();
  });

  test('应该显示测试结果', async ({ page }) => {
    // 登录并访问页面
    await login(page);
    await page.goto('/maps-test');
    await page.waitForLoadState('networkidle');
    
    // 等待测试自动运行
    await page.waitForTimeout(5000);
    
    // 检查是否显示测试结果区域
    const resultsSection = page.locator('h4:has-text("测试结果")');
    await expect(resultsSection).toBeVisible();
    
    // 检查测试项目
    await expect(page.locator('text=地图服务初始化')).toBeVisible();
    await expect(page.locator('text=地址解析')).toBeVisible();
    await expect(page.locator('text=反向地址解析')).toBeVisible();
    
    // 检查是否有错误信息显示
    const errorAlert = page.locator('.ant-alert-error');
    const errorCount = await errorAlert.count();
    
    if (errorCount > 0) {
      console.log('检测到地图API错误:', await errorAlert.textContent());
    }
    
    // 截图保存测试结果
    await page.screenshot({ path: 'maps-test-results.png', fullPage: true });
  });

  test('应该能够手动运行测试', async ({ page }) => {
    // 登录并访问页面
    await login(page);
    await page.goto('/maps-test');
    await page.waitForLoadState('networkidle');
    
    // 修改测试地址
    await page.fill('input[placeholder*="测试地址"]', 'CN Tower, Toronto, ON');
    
    // 点击运行测试按钮
    await page.click('button:has-text("运行地图API测试")');
    
    // 等待测试完成
    await page.waitForTimeout(3000);
    
    // 检查测试结果更新
    await expect(page.locator('text=地图服务初始化')).toBeVisible();
  });

  test('应该显示故障排除指南', async ({ page }) => {
    // 登录并访问页面
    await login(page);
    await page.goto('/maps-test');
    await page.waitForLoadState('networkidle');
    
    // 检查故障排除指南
    await expect(page.locator('h4:has-text("故障排除指南")')).toBeVisible();
    
    // 检查警告信息
    await expect(page.locator('text=Google Maps API 计费问题')).toBeVisible();
    await expect(page.locator('text=API 密钥配置')).toBeVisible();
    await expect(page.locator('text=网络连接问题')).toBeVisible();
  });
});

test.describe('地图API错误分析', () => {
  test('收集地图API错误信息', async ({ page }) => {
    console.log('\n=== 地图API错误分析报告 ===');
    
    // 登录并访问页面
    await login(page);
    await page.goto('/maps-test');
    
    const errors: string[] = [];
    const warnings: string[] = [];
    const apiRequests: Array<{url: string, status: number}> = [];
    
    // 监听控制台错误
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      } else if (msg.type() === 'warning') {
        warnings.push(msg.text());
      }
    });
    
    // 监听网络请求
    page.on('response', response => {
      const url = response.url();
      if (url.includes('googleapis.com') || url.includes('google.com')) {
        apiRequests.push({
          url: response.url(),
          status: response.status()
        });
      }
    });
    
    // 等待页面加载和测试运行
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(8000);
    
    // 输出分析报告
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
    
    console.log('\n3. Google API 请求状态:');
    if (apiRequests.length > 0) {
      apiRequests.forEach((req, index) => {
        console.log(`   ${index + 1}. [${req.status}] ${req.url}`);
      });
    } else {
      console.log('   无Google API请求');
    }
    
    // 检查测试结果
    const testResults = await page.locator('.ant-card').nth(1).textContent();
    console.log('\n4. 测试结果摘要:');
    console.log(testResults);
    
    console.log('\n=== 报告结束 ===');
  });
});
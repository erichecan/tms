// 综合检测测试 - 检测所有主要页面的错误
// 创建时间: 2025-10-17T14:31:00
import { test, expect } from '@playwright/test';

// 定义要测试的页面路由
const routes = [
  { path: '/', name: '首页' },
  { path: '/login', name: '登录页' },
  { path: '/admin', name: 'Dashboard' },
  { path: '/admin/shipments', name: '货运管理' },
  { path: '/admin/customers', name: '客户管理' },
  { path: '/admin/finance', name: '财务管理' },
  { path: '/admin/fleet', name: '车队管理' },
  { path: '/admin/pricing', name: '定价引擎' },
  { path: '/create-shipment', name: '创建货运' },
];

test.describe('综合页面错误检测', () => {
  for (const route of routes) {
    test(`检测 ${route.name} (${route.path}) 的错误`, async ({ page }) => {
      const consoleErrors: string[] = [];
      const pageErrors: string[] = [];
      const failedRequests: Array<{ url: string; status: number; statusText: string }> = [];
      const warnings: string[] = [];
      
      // 监听控制台错误
      page.on('console', msg => {
        if (msg.type() === 'error') {
          consoleErrors.push(msg.text());
        } else if (msg.type() === 'warning') {
          warnings.push(msg.text());
        }
      });
      
      // 监听页面错误
      page.on('pageerror', error => {
        pageErrors.push(error.message);
      });
      
      // 监听网络请求
      page.on('response', response => {
        // 忽略重定向和缓存
        if (!response.ok() && response.status() !== 304 && response.status() < 400) {
          return;
        }
        if (response.status() >= 400) {
          failedRequests.push({
            url: response.url(),
            status: response.status(),
            statusText: response.statusText()
          });
        }
      });
      
      try {
        // 访问页面
        await page.goto(route.path, { waitUntil: 'networkidle', timeout: 30000 });
        
        // 等待页面完全加载
        await page.waitForTimeout(2000);
        
        // 获取页面标题和 URL
        const title = await page.title();
        const currentUrl = page.url();
        
        console.log(`\n========== ${route.name} (${route.path}) ==========`);
        console.log(`当前 URL: ${currentUrl}`);
        console.log(`页面标题: ${title}`);
        
        // 输出所有发现的问题
        if (consoleErrors.length > 0) {
          console.log(`\n❌ 控制台错误 (${consoleErrors.length}):`);
          consoleErrors.forEach((error, index) => {
            console.log(`  ${index + 1}. ${error}`);
          });
        }
        
        if (pageErrors.length > 0) {
          console.log(`\n❌ 页面错误 (${pageErrors.length}):`);
          pageErrors.forEach((error, index) => {
            console.log(`  ${index + 1}. ${error}`);
          });
        }
        
        if (failedRequests.length > 0) {
          console.log(`\n❌ 失败的请求 (${failedRequests.length}):`);
          failedRequests.forEach((req, index) => {
            console.log(`  ${index + 1}. [${req.status}] ${req.url}`);
          });
        }
        
        if (warnings.length > 0) {
          console.log(`\n⚠️  警告 (${warnings.length}):`);
          warnings.slice(0, 5).forEach((warning, index) => {
            console.log(`  ${index + 1}. ${warning}`);
          });
          if (warnings.length > 5) {
            console.log(`  ... 还有 ${warnings.length - 5} 个警告`);
          }
        }
        
        if (consoleErrors.length === 0 && pageErrors.length === 0 && failedRequests.length === 0) {
          console.log('\n✅ 未发现错误');
        }
        
        console.log('==========================================\n');
        
      } catch (error) {
        console.log(`\n❌ 访问 ${route.name} 时发生异常:`);
        console.log(`  ${error}`);
        console.log('==========================================\n');
      }
    });
  }
});

test.describe('性能和资源检测', () => {
  test('检测页面加载性能', async ({ page }) => {
    await page.goto('/');
    
    const performanceTiming = await page.evaluate(() => {
      const perf = window.performance.timing;
      return {
        loadTime: perf.loadEventEnd - perf.navigationStart,
        domReady: perf.domContentLoadedEventEnd - perf.navigationStart,
        responseTime: perf.responseEnd - perf.requestStart,
      };
    });
    
    console.log('\n========== 性能指标 ==========');
    console.log(`页面加载时间: ${performanceTiming.loadTime}ms`);
    console.log(`DOM 就绪时间: ${performanceTiming.domReady}ms`);
    console.log(`响应时间: ${performanceTiming.responseTime}ms`);
    console.log('==============================\n');
    
    // 检查加载时间是否合理（不超过 10 秒）
    expect(performanceTiming.loadTime).toBeLessThan(10000);
  });
});


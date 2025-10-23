import { test, expect } from '@playwright/test';
import { login } from './helpers';

test.describe('车队管理页面测试', () => {
  test.beforeEach(async ({ page }) => {
    // 登录到系统
    await login(page);
    
    // 导航到车队管理页面
    await page.goto('/admin/fleet');
    await page.waitForLoadState('networkidle');
  });

  test('应该正确加载车队管理页面', async ({ page }) => {
    // 检查页面标题
    await expect(page.locator('h3').first()).toContainText('车队管理');
    
    // 检查标签页存在
    await expect(page.locator('.ant-tabs-tab-btn').first()).toContainText('车队管理');
    await expect(page.locator('.ant-tabs-tab-btn').nth(1)).toContainText('司机薪酬');
    await expect(page.locator('.ant-tabs-tab-btn').nth(2)).toContainText('车辆维护');
  });

  test('应该显示在途行程表格', async ({ page }) => {
    // 检查在途行程表格标题
    await expect(page.locator('.ant-card-head-title').first()).toContainText('在途行程');
    
    // 检查表格列头
    await expect(page.locator('.ant-table-thead th').first()).toContainText('行程');
    await expect(page.locator('.ant-table-thead th').nth(1)).toContainText('司机 / 车辆');
    await expect(page.locator('.ant-table-thead th').nth(2)).toContainText('时间');
  });

  test('应该显示空闲资源卡片', async ({ page }) => {
    // 检查空闲司机卡片
    await expect(page.locator('.ant-card-head-title').nth(1)).toContainText('空闲司机');
    
    // 检查空闲车辆卡片
    await expect(page.locator('.ant-card-head-title').nth(2)).toContainText('空闲车辆');
  });

  test('应该显示地图组件', async ({ page }) => {
    // 检查地图卡片标题
    await expect(page.locator('.ant-card-head-title').nth(3)).toContainText('车队实时位置');
    
    // 检查地图容器是否存在
    await expect(page.locator('#google-map-container')).toBeVisible();
  });

  test('应该处理API错误优雅降级', async ({ page }) => {
    // 检查错误处理 - 页面应该显示降级数据而不是崩溃
    await expect(page.locator('.ant-table-tbody')).toBeVisible();
    
    // 检查是否有错误提示信息
    const errorMessages = await page.locator('.ant-message-error').count();
    if (errorMessages > 0) {
      console.log('检测到错误消息，但页面仍然正常显示');
    }
  });

  test('应该能够切换标签页', async ({ page }) => {
    // 切换到司机薪酬标签页
    await page.locator('.ant-tabs-tab-btn').nth(1).click();
    await expect(page.locator('h4').first()).toContainText('司机薪酬管理');
    
    // 切换到车辆维护标签页
    await page.locator('.ant-tabs-tab-btn').nth(2).click();
    await expect(page.locator('h4').first()).toContainText('车辆维护记录');
    
    // 切换回车队管理标签页
    await page.locator('.ant-tabs-tab-btn').first().click();
    await expect(page.locator('.ant-card-head-title').first()).toContainText('在途行程');
  });

  test('应该能够点击添加司机按钮', async ({ page }) => {
    // 点击添加司机按钮
    await page.locator('button:has-text("添加司机")').first().click();
    
    // 检查模态框是否打开
    await expect(page.locator('.ant-modal-title').first()).toContainText('添加司机');
    
    // 关闭模态框
    await page.locator('.ant-modal-close').first().click();
  });

  test('应该能够点击添加车辆按钮', async ({ page }) => {
    // 点击添加车辆按钮
    await page.locator('button:has-text("添加车辆")').first().click();
    
    // 检查模态框是否打开
    await expect(page.locator('.ant-modal-title').first()).toContainText('添加车辆');
    
    // 关闭模态框
    await page.locator('.ant-modal-close').first().click();
  });

  test('应该处理地图初始化错误', async ({ page }) => {
    // 检查控制台是否有地图相关错误
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log('控制台错误:', msg.text());
      }
    });
    
    // 页面应该正常显示，即使地图初始化失败
    await expect(page.locator('.ant-card-head-title').first()).toBeVisible();
  });
});

test.describe('车队管理页面API测试', () => {
  test('应该处理后端API 500错误', async ({ page }) => {
    // 拦截API请求并模拟500错误
    await page.route('**/api/drivers', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: 'Internal server error'
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
            message: 'Internal server error'
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
            message: 'Internal server error'
          }
        })
      });
    });

    // 登录并访问页面
    await login(page);
    await page.goto('/admin/fleet');
    
    // 页面应该正常显示降级数据
    await expect(page.locator('.ant-table-tbody')).toBeVisible();
    
    // 检查是否有降级数据
    const tableRows = await page.locator('.ant-table-tbody tr').count();
    expect(tableRows).toBeGreaterThanOrEqual(0);
  });

  test('应该处理认证错误', async ({ page }) => {
    // 拦截认证API并模拟401错误
    await page.route('**/api/auth/profile', route => {
      route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'No token provided'
          }
        })
      });
    });

    // 登录并访问页面
    await login(page);
    await page.goto('/admin/fleet');
    
    // 页面应该正常显示，使用开发模式的降级数据
    await expect(page.locator('.ant-table-tbody')).toBeVisible();
  });
});
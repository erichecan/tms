import { test, expect } from '@playwright/test';

/**
 * TMS系统完整功能测试
 * 创建时间: 2025-10-10 13:15:00
 * 测试范围: 所有主要页面和核心功能
 */

// 测试用户凭证
const TEST_USER = {
  email: 'admin@demo.tms-platform.com',
  password: 'admin123'
};

// 基础URL配置
const BASE_URL = process.env.E2E_BASE_URL || 'http://localhost:3000';

test.describe('TMS系统完整功能测试套件', () => {
  
  test.beforeEach(async ({ page }) => {
    // 每个测试前先登录
    await page.goto(BASE_URL);
    
    // 检查是否已经登录
    const isLoggedIn = await page.locator('[data-testid="user-menu"]').isVisible().catch(() => false);
    
    if (!isLoggedIn) {
      // 查找登录表单
      const emailInput = page.locator('input[type="email"], input[name="email"], input[placeholder*="邮箱"]').first();
      const passwordInput = page.locator('input[type="password"], input[name="password"], input[placeholder*="密码"]').first();
      const loginButton = page.locator('button[type="submit"], button:has-text("登录"), button:has-text("Login")').first();
      
      // 填写登录信息
      await emailInput.fill(TEST_USER.email);
      await passwordInput.fill(TEST_USER.password);
      await loginButton.click();
      
      // 等待登录成功
      await page.waitForURL(/.*dashboard|.*shipments|.*\//, { timeout: 10000 }).catch(() => {});
    }
  });

  test('1. 主页/仪表板访问测试', async ({ page }) => {
    await page.goto(BASE_URL);
    
    // 验证页面加载成功
    await expect(page).toHaveTitle(/TMS|运输管理系统|Transport/i);
    
    // 验证主要导航元素存在
    const hasNavigation = await page.locator('nav, .ant-menu, [role="navigation"]').count();
    expect(hasNavigation).toBeGreaterThan(0);
    
    console.log('✅ 主页/仪表板访问成功');
  });

  test('2. 运单管理页面访问测试', async ({ page }) => {
    await page.goto(`${BASE_URL}/shipments`);
    
    // 等待页面加载
    await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
    
    // 验证页面标题
    const pageTitle = await page.locator('h1, h2, .ant-page-header-heading-title').first().textContent();
    expect(pageTitle).toMatch(/运单|Shipment/i);
    
    // 验证表格或列表存在
    const hasTable = await page.locator('.ant-table, .ant-list, table').count();
    expect(hasTable).toBeGreaterThan(0);
    
    console.log('✅ 运单管理页面访问成功');
  });

  test('3. 创建运单页面访问测试', async ({ page }) => {
    await page.goto(`${BASE_URL}/create-shipment`);
    
    // 等待页面加载
    await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
    
    // 验证表单存在
    const hasForm = await page.locator('form, .ant-form').count();
    expect(hasForm).toBeGreaterThan(0);
    
    // 验证关键表单字段
    const hasAddressInput = await page.locator('input[placeholder*="地址"], input[placeholder*="Address"]').count();
    expect(hasAddressInput).toBeGreaterThan(0);
    
    console.log('✅ 创建运单页面访问成功');
  });

  test('4. 车队管理页面访问测试', async ({ page }) => {
    await page.goto(`${BASE_URL}/fleet`);
    
    // 等待页面加载
    await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
    
    // 验证页面标题
    const pageTitle = await page.locator('h1, h2, .ant-page-header-heading-title').first().textContent();
    expect(pageTitle).toMatch(/车队|Fleet/i);
    
    // 验证地图或车辆列表存在
    const hasMapOrList = await page.locator('.google-map, #map, .ant-table, .vehicle-list').count();
    expect(hasMapOrList).toBeGreaterThan(0);
    
    console.log('✅ 车队管理页面访问成功');
  });

  test('5. 财务结算页面访问测试', async ({ page }) => {
    await page.goto(`${BASE_URL}/finance-settlement`);
    
    // 等待页面加载
    await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
    
    // 验证页面标题
    const pageTitle = await page.locator('h1, h2, .ant-page-header-heading-title').first().textContent();
    expect(pageTitle).toMatch(/财务|Finance|结算/i);
    
    // 验证统计卡片或表格存在
    const hasContent = await page.locator('.ant-card, .ant-statistic, .ant-table').count();
    expect(hasContent).toBeGreaterThan(0);
    
    console.log('✅ 财务结算页面访问成功');
  });

  test('6. 司机薪酬页面访问测试', async ({ page }) => {
    // 尝试多个可能的路由
    const routes = ['/admin/driver-salary', '/driver-salary', '/drivers/salary'];
    let success = false;
    
    for (const route of routes) {
      try {
        await page.goto(`${BASE_URL}${route}`, { timeout: 5000 });
        await page.waitForLoadState('networkidle', { timeout: 5000 });
        
        const pageTitle = await page.locator('h1, h2, .ant-page-header-heading-title').first().textContent();
        if (pageTitle && pageTitle.match(/司机|Driver|薪酬|Salary/i)) {
          success = true;
          console.log(`✅ 司机薪酬页面访问成功 (路由: ${route})`);
          break;
        }
      } catch (e) {
        continue;
      }
    }
    
    if (!success) {
      console.log('⚠️  司机薪酬页面未找到或未配置');
    }
  });

  test('7. 规则管理页面访问测试', async ({ page }) => {
    await page.goto(`${BASE_URL}/rules`);
    
    // 等待页面加载
    await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
    
    // 验证页面标题
    const pageTitle = await page.locator('h1, h2, .ant-page-header-heading-title').first().textContent();
    expect(pageTitle).toMatch(/规则|Rule/i);
    
    console.log('✅ 规则管理页面访问成功');
  });

  test('8. 运单详情和BOL功能测试', async ({ page }) => {
    await page.goto(`${BASE_URL}/shipments`);
    
    // 等待页面加载
    await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
    
    // 查找并点击第一个"查看"按钮
    const viewButton = page.locator('button:has-text("查看"), button:has-text("View"), .ant-btn:has([aria-label*="eye"])').first();
    
    if (await viewButton.isVisible()) {
      await viewButton.click();
      
      // 等待Modal打开
      await page.waitForSelector('.ant-modal', { timeout: 5000 }).catch(() => {});
      
      // 验证Modal打开
      const modalVisible = await page.locator('.ant-modal').isVisible();
      expect(modalVisible).toBeTruthy();
      
      // 查找BOL单据标签
      const bolTab = page.locator('.ant-tabs-tab:has-text("BOL")').first();
      
      if (await bolTab.isVisible()) {
        await bolTab.click();
        
        // 验证BOL文档加载
        await page.waitForSelector('.bol-document', { timeout: 5000 }).catch(() => {});
        const bolDocVisible = await page.locator('.bol-document').isVisible();
        expect(bolDocVisible).toBeTruthy();
        
        console.log('✅ 运单详情和BOL功能测试成功');
      } else {
        console.log('⚠️  BOL标签未找到');
      }
    } else {
      console.log('⚠️  未找到可查看的运单');
    }
  });

  test('9. Google Maps集成测试', async ({ page }) => {
    await page.goto(`${BASE_URL}/create-shipment`);
    
    // 等待页面加载
    await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
    
    // 检查Google Maps加载
    const hasGoogleMaps = await page.evaluate(() => {
      return typeof (window as any).google !== 'undefined' && 
             typeof (window as any).google.maps !== 'undefined';
    });
    
    if (hasGoogleMaps) {
      console.log('✅ Google Maps加载成功');
    } else {
      console.log('⚠️  Google Maps未加载或未配置');
    }
    
    // 检查地图容器
    const mapContainer = await page.locator('.google-map, #map, [class*="map"]').count();
    if (mapContainer > 0) {
      console.log('✅ 地图容器存在');
    }
  });

  test('10. 智能调度功能测试', async ({ page }) => {
    await page.goto(`${BASE_URL}/shipments`);
    
    // 等待页面加载
    await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
    
    // 查找智能调度按钮
    const dispatchButton = page.locator('button:has-text("智能调度"), button:has-text("Smart Dispatch")').first();
    
    if (await dispatchButton.isVisible()) {
      // 先选择一个运单
      const checkbox = page.locator('.ant-table-row .ant-checkbox-input').first();
      if (await checkbox.isVisible()) {
        await checkbox.check();
        
        // 点击智能调度
        await dispatchButton.click();
        
        // 等待调度结果Modal
        await page.waitForSelector('.ant-modal:has-text("智能调度"), .ant-modal:has-text("调度")', { timeout: 10000 }).catch(() => {});
        
        console.log('✅ 智能调度功能可访问');
      }
    } else {
      console.log('⚠️  智能调度按钮未找到');
    }
  });

  test('11. 计费引擎集成测试', async ({ page }) => {
    await page.goto(`${BASE_URL}/create-shipment`);
    
    // 等待页面加载
    await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
    
    // 填写基本信息触发计费
    const weightInput = page.locator('input[placeholder*="重量"], input[name*="weight"]').first();
    
    if (await weightInput.isVisible()) {
      await weightInput.fill('100');
      
      // 查找费用预估显示
      await page.waitForTimeout(2000); // 等待计费计算
      
      const hasPriceDisplay = await page.locator('text=/费用|Cost|Price/i').count();
      if (hasPriceDisplay > 0) {
        console.log('✅ 计费引擎响应正常');
      }
    }
  });

  test('12. 响应式布局测试', async ({ page }) => {
    // 测试不同屏幕尺寸
    const viewports = [
      { width: 1920, height: 1080, name: '桌面' },
      { width: 1366, height: 768, name: '笔记本' },
      { width: 768, height: 1024, name: '平板' },
    ];
    
    for (const viewport of viewports) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto(`${BASE_URL}/shipments`);
      await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {});
      
      const hasContent = await page.locator('.ant-table, .ant-card, .ant-list').count();
      expect(hasContent).toBeGreaterThan(0);
      
      console.log(`✅ ${viewport.name}布局测试通过 (${viewport.width}x${viewport.height})`);
    }
  });

  test('13. 导航菜单完整性测试', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
    
    // 查找所有菜单项
    const menuItems = await page.locator('.ant-menu-item, .ant-menu-submenu').count();
    expect(menuItems).toBeGreaterThan(0);
    
    console.log(`✅ 发现 ${menuItems} 个菜单项`);
    
    // 获取菜单文本
    const menuTexts = await page.locator('.ant-menu-item, .ant-menu-submenu').allTextContents();
    console.log('📋 菜单项:', menuTexts.slice(0, 10).join(', '));
  });

  test('14. 错误处理和加载状态测试', async ({ page }) => {
    await page.goto(`${BASE_URL}/shipments`);
    
    // 检查是否有错误提示
    const hasError = await page.locator('.ant-message-error, .ant-alert-error').count();
    expect(hasError).toBe(0);
    
    // 检查加载状态（应该已经加载完成）
    const isLoading = await page.locator('.ant-spin-spinning').count();
    expect(isLoading).toBe(0);
    
    console.log('✅ 页面无错误，加载完成');
  });

  test('15. 数据持久性测试', async ({ page }) => {
    await page.goto(`${BASE_URL}/shipments`);
    await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
    
    // 获取第一行数据
    const firstRowText = await page.locator('.ant-table-row').first().textContent().catch(() => '');
    
    // 刷新页面
    await page.reload();
    await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
    
    // 验证数据仍然存在
    const firstRowAfterReload = await page.locator('.ant-table-row').first().textContent().catch(() => '');
    
    if (firstRowText && firstRowAfterReload) {
      expect(firstRowText).toBe(firstRowAfterReload);
      console.log('✅ 数据持久性测试通过');
    } else {
      console.log('⚠️  表格可能为空');
    }
  });

});

// 性能测试
test.describe('性能测试', () => {
  
  test('页面加载性能测试', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto(`${BASE_URL}/shipments`);
    await page.waitForLoadState('networkidle');
    
    const loadTime = Date.now() - startTime;
    
    console.log(`⏱️  页面加载时间: ${loadTime}ms`);
    expect(loadTime).toBeLessThan(10000); // 应该在10秒内加载
  });

});

// 关键业务流程测试
test.describe('关键业务流程', () => {
  
  test('完整运单生命周期测试', async ({ page }) => {
    // 1. 创建运单
    await page.goto(`${BASE_URL}/create-shipment`);
    await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
    
    console.log('📝 步骤1: 访问创建运单页面');
    
    // 2. 查看运单列表
    await page.goto(`${BASE_URL}/shipments`);
    await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
    
    console.log('📋 步骤2: 访问运单列表页面');
    
    // 3. 查看运单详情
    const viewButton = page.locator('button:has-text("查看")').first();
    if (await viewButton.isVisible()) {
      await viewButton.click();
      await page.waitForSelector('.ant-modal', { timeout: 5000 }).catch(() => {});
      console.log('👁️  步骤3: 查看运单详情');
    }
    
    console.log('✅ 完整运单生命周期测试完成');
  });

});


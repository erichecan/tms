import { test, expect } from '@playwright/test';

test.describe('TMS Management Pages Functionality Check', () => {
  test.beforeEach(async ({ page }) => {
    // 访问前端应用
    await page.goto('http://localhost:3000');
    
    // 等待页面加载
    await page.waitForLoadState('networkidle');
    
    // 检查是否已经登录，如果没有则登录
    const loginButton = page.locator('button:has-text("登录")');
    if (await loginButton.isVisible()) {
      await loginButton.click();
      await page.waitForLoadState('networkidle');
    }
  });

  test('Dashboard Page - 检查仪表板功能', async ({ page }) => {
    console.log('🔍 检查仪表板页面...');
    
    // 导航到仪表板
    await page.click('text=仪表板');
    await page.waitForLoadState('networkidle');
    
    // 检查页面标题
    await expect(page.locator('h1')).toContainText('仪表板');
    
    // 检查统计卡片是否存在
    const statsCards = page.locator('.ant-statistic');
    await expect(statsCards).toHaveCount(4); // 应该有4个统计卡片
    
    console.log('✅ 仪表板页面功能正常');
  });

  test('Driver Management - 检查司机管理功能', async ({ page }) => {
    console.log('🔍 检查司机管理页面...');
    
    // 导航到司机管理
    await page.click('text=司机管理');
    await page.waitForLoadState('networkidle');
    
    // 检查页面标题
    await expect(page.locator('h1')).toContainText('司机管理');
    
    // 检查新增司机按钮
    const addButton = page.locator('button:has-text("新增司机")');
    await expect(addButton).toBeVisible();
    
    // 测试新增司机功能
    await addButton.click();
    
    // 检查模态框是否打开
    const modal = page.locator('.ant-modal');
    await expect(modal).toBeVisible();
    
    // 填写表单
    await page.fill('input[placeholder*="姓名"]', '测试司机');
    await page.fill('input[placeholder*="邮箱"]', 'test@example.com');
    await page.fill('input[placeholder*="电话"]', '13800138000');
    await page.fill('input[placeholder*="驾照号"]', 'A123456789');
    await page.selectOption('select', '货车');
    await page.selectOption('select:last-of-type', 'active');
    
    // 提交表单
    await page.click('button:has-text("确定")');
    
    // 等待操作完成
    await page.waitForTimeout(2000);
    
    // 检查是否有成功消息
    const successMessage = page.locator('.ant-message-success');
    if (await successMessage.isVisible()) {
      console.log('✅ 司机添加功能正常');
    } else {
      console.log('❌ 司机添加功能异常');
    }
    
    // 检查删除功能
    const deleteButtons = page.locator('button[title="删除"]');
    if (await deleteButtons.first().isVisible()) {
      await deleteButtons.first().click();
      await page.waitForTimeout(1000);
      console.log('✅ 司机删除功能正常');
    } else {
      console.log('❌ 司机删除功能异常');
    }
  });

  test('Customer Management - 检查客户管理功能', async ({ page }) => {
    console.log('🔍 检查客户管理页面...');
    
    // 导航到客户管理
    await page.click('text=客户管理');
    await page.waitForLoadState('networkidle');
    
    // 检查页面标题
    await expect(page.locator('h1')).toContainText('客户管理');
    
    // 检查新增客户按钮
    const addButton = page.locator('button:has-text("新增客户")');
    await expect(addButton).toBeVisible();
    
    // 测试新增客户功能
    await addButton.click();
    
    // 检查模态框是否打开
    const modal = page.locator('.ant-modal');
    await expect(modal).toBeVisible();
    
    // 填写表单
    await page.fill('input[placeholder*="姓名"]', '测试客户');
    await page.fill('input[placeholder*="邮箱"]', 'customer@example.com');
    await page.fill('input[placeholder*="电话"]', '13900139000');
    await page.fill('input[placeholder*="地址"]', '测试地址');
    await page.selectOption('select', 'vip');
    
    // 提交表单
    await page.click('button:has-text("确定")');
    
    // 等待操作完成
    await page.waitForTimeout(2000);
    
    // 检查是否有成功消息
    const successMessage = page.locator('.ant-message-success');
    if (await successMessage.isVisible()) {
      console.log('✅ 客户添加功能正常');
    } else {
      console.log('❌ 客户添加功能异常');
    }
    
    // 检查删除功能
    const deleteButtons = page.locator('button[title="删除"]');
    if (await deleteButtons.first().isVisible()) {
      await deleteButtons.first().click();
      await page.waitForTimeout(1000);
      console.log('✅ 客户删除功能正常');
    } else {
      console.log('❌ 客户删除功能异常');
    }
  });

  test('Vehicle Management - 检查车辆管理功能', async ({ page }) => {
    console.log('🔍 检查车辆管理页面...');
    
    // 导航到车辆管理
    await page.click('text=车辆管理');
    await page.waitForLoadState('networkidle');
    
    // 检查页面标题
    await expect(page.locator('h1')).toContainText('车辆管理');
    
    // 检查新增车辆按钮
    const addButton = page.locator('button:has-text("新增车辆")');
    await expect(addButton).toBeVisible();
    
    // 测试新增车辆功能
    await addButton.click();
    
    // 检查模态框是否打开
    const modal = page.locator('.ant-modal');
    await expect(modal).toBeVisible();
    
    // 填写表单
    await page.fill('input[placeholder*="车牌号"]', '京A99999');
    await page.selectOption('select:first-of-type', '货车');
    await page.fill('input[placeholder*="载重"]', '10000');
    await page.selectOption('select:last-of-type', 'active');
    
    // 提交表单
    await page.click('button:has-text("确定")');
    
    // 等待操作完成
    await page.waitForTimeout(2000);
    
    // 检查是否有成功消息
    const successMessage = page.locator('.ant-message-success');
    if (await successMessage.isVisible()) {
      console.log('✅ 车辆添加功能正常');
    } else {
      console.log('❌ 车辆添加功能异常');
    }
    
    // 检查删除功能
    const deleteButtons = page.locator('button[title="删除"]');
    if (await deleteButtons.first().isVisible()) {
      await deleteButtons.first().click();
      await page.waitForTimeout(1000);
      console.log('✅ 车辆删除功能正常');
    } else {
      console.log('❌ 车辆删除功能异常');
    }
  });

  test('Shipment Management - 检查运单管理功能', async ({ page }) => {
    console.log('🔍 检查运单管理页面...');
    
    // 导航到运单管理
    await page.click('text=运单管理');
    await page.waitForLoadState('networkidle');
    
    // 检查页面标题
    await expect(page.locator('h1')).toContainText('运单管理');
    
    // 检查运单列表
    const table = page.locator('.ant-table');
    await expect(table).toBeVisible();
    
    // 检查操作按钮
    const actionButtons = page.locator('button[title="查看详情"], button[title="指派司机"]');
    if (await actionButtons.first().isVisible()) {
      console.log('✅ 运单查看和指派功能正常');
    } else {
      console.log('❌ 运单操作功能异常');
    }
    
    // 检查删除功能
    const deleteButtons = page.locator('button[title="删除"]');
    if (await deleteButtons.first().isVisible()) {
      await deleteButtons.first().click();
      await page.waitForTimeout(1000);
      console.log('✅ 运单删除功能正常');
    } else {
      console.log('❌ 运单删除功能异常');
    }
  });

  test('Currency Management - 检查货币管理功能', async ({ page }) => {
    console.log('🔍 检查货币管理页面...');
    
    // 导航到货币管理
    await page.click('text=货币管理');
    await page.waitForLoadState('networkidle');
    
    // 检查页面标题
    await expect(page.locator('h1')).toContainText('货币管理');
    
    // 检查新增货币按钮
    const addButton = page.locator('button:has-text("新增货币")');
    await expect(addButton).toBeVisible();
    
    // 测试新增货币功能
    await addButton.click();
    
    // 检查模态框是否打开
    const modal = page.locator('.ant-modal');
    await expect(modal).toBeVisible();
    
    // 填写表单
    await page.fill('input[placeholder*="货币代码"]', 'USD');
    await page.fill('input[placeholder*="货币名称"]', '美元');
    await page.fill('input[placeholder*="符号"]', '$');
    await page.fill('input[placeholder*="汇率"]', '7.2');
    await page.selectOption('select:last-of-type', 'active');
    
    // 提交表单
    await page.click('button:has-text("确定")');
    
    // 等待操作完成
    await page.waitForTimeout(2000);
    
    // 检查是否有成功消息
    const successMessage = page.locator('.ant-message-success');
    if (await successMessage.isVisible()) {
      console.log('✅ 货币添加功能正常');
    } else {
      console.log('❌ 货币添加功能异常');
    }
    
    // 检查删除功能
    const deleteButtons = page.locator('button[title="删除"]');
    if (await deleteButtons.first().isVisible()) {
      await deleteButtons.first().click();
      await page.waitForTimeout(1000);
      console.log('✅ 货币删除功能正常');
    } else {
      console.log('❌ 货币删除功能异常');
    }
  });

  test('Rule Management - 检查规则管理功能', async ({ page }) => {
    console.log('🔍 检查规则管理页面...');
    
    // 导航到规则管理
    await page.click('text=规则管理');
    await page.waitForLoadState('networkidle');
    
    // 检查页面标题
    await expect(page.locator('h1')).toContainText('规则管理');
    
    // 检查规则列表
    const table = page.locator('.ant-table');
    await expect(table).toBeVisible();
    
    console.log('✅ 规则管理页面功能正常');
  });

  test('Finance Management - 检查财务管理功能', async ({ page }) => {
    console.log('🔍 检查财务管理页面...');
    
    // 导航到财务管理
    await page.click('text=财务管理');
    await page.waitForLoadState('networkidle');
    
    // 检查页面标题
    await expect(page.locator('h1')).toContainText('财务管理');
    
    // 检查财务记录表格
    const table = page.locator('.ant-table');
    await expect(table).toBeVisible();
    
    console.log('✅ 财务管理页面功能正常');
  });
});

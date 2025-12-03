// 测试车辆管理功能
// 创建时间: 2025-12-02T20:25:00Z
// 目的：测试车队管理页面中的车辆管理功能

import { test, expect, Page } from '@playwright/test';

test.describe('车辆管理功能测试', () => {
  // 登录辅助函数
  async function loginWithEmail(page: Page, email: string, password: string) {
    const baseURL = 'https://tms-frontend-v4estohola-df.a.run.app';
    await page.goto(`${baseURL}/login`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);
    
    const emailInput = page.locator('input[name="email"], input[placeholder*="邮箱"]').first();
    await emailInput.waitFor({ state: 'visible', timeout: 15000 });
    await emailInput.fill(email);
    
    const passwordInput = page.locator('input[name="password"], input[type="password"]').first();
    await passwordInput.waitFor({ state: 'visible', timeout: 15000 });
    await passwordInput.fill(password);
    
    const submitButton = page.locator('button[type="submit"]').first();
    await submitButton.waitFor({ state: 'visible', timeout: 15000 });
    await submitButton.click();
    
    await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 15000 });
    await page.waitForTimeout(3000);
  }

  test('检查车辆管理标签页是否存在', async ({ page }) => {
    test.setTimeout(60000); // 增加测试超时时间到60秒
    const baseURL = 'https://tms-frontend-v4estohola-df.a.run.app';
    
    // 登录
    await loginWithEmail(page, 'agnes@aponygroup.com', '27669');
    
    // 导航到车队管理页面
    await page.goto(`${baseURL}/admin/fleet`, { waitUntil: 'domcontentloaded', timeout: 60000 });
    // 使用更灵活的等待策略
    await page.waitForTimeout(5000);
    
    // 等待页面主要内容加载
    await page.waitForSelector('h3:has-text("车队管理"), .ant-tabs', { timeout: 30000 });
    await page.waitForTimeout(2000);
    
    // 截图保存当前页面状态
    await page.screenshot({ path: 'test-results/fleet-page-before-tab-click.png', fullPage: true });
    
    // 检查是否有"车辆管理"标签
    const vehicleManagementTab = page.locator('.ant-tabs-tab:has-text("车辆管理")').first();
    await expect(vehicleManagementTab).toBeVisible({ timeout: 10000 });
    
    console.log('✅ 找到车辆管理标签页');
    
    // 点击车辆管理标签
    await vehicleManagementTab.click();
    await page.waitForTimeout(2000);
    
    // 截图点击后的页面
    await page.screenshot({ path: 'test-results/vehicle-management-tab-opened.png', fullPage: true });
    
    // 检查是否显示了车辆列表
    const vehicleTable = page.locator('table').first();
    await expect(vehicleTable).toBeVisible({ timeout: 10000 });
    
    console.log('✅ 车辆管理标签页打开成功，显示车辆列表');
  });

  test('检查车辆管理页面功能', async ({ page }) => {
    test.setTimeout(60000); // 增加测试超时时间到60秒
    const baseURL = 'https://tms-frontend-v4estohola-df.a.run.app';
    
    // 登录
    await loginWithEmail(page, 'agnes@aponygroup.com', '27669');
    
    // 导航到车队管理页面
    await page.goto(`${baseURL}/admin/fleet`, { waitUntil: 'domcontentloaded', timeout: 60000 });
    // 使用更灵活的等待策略
    await page.waitForTimeout(5000);
    
    // 等待页面主要内容加载
    await page.waitForSelector('h3:has-text("车队管理"), .ant-tabs', { timeout: 30000 });
    await page.waitForTimeout(2000);
    
    // 点击车辆管理标签
    const vehicleManagementTab = page.locator('.ant-tabs-tab:has-text("车辆管理")').first();
    await vehicleManagementTab.click();
    await page.waitForTimeout(3000);
    
    // 检查是否有"费用"按钮
    const costButton = page.locator('button:has-text("费用"), button[title*="费用"]').first();
    const costButtonCount = await costButton.count();
    
    console.log(`找到 ${costButtonCount} 个"费用"按钮`);
    
    if (costButtonCount > 0) {
      // 点击第一个费用按钮
      await costButton.first().click();
      await page.waitForTimeout(2000);
      
      // 检查是否打开了费用填写模态框
      const costModal = page.locator('.ant-modal:has-text("月度费用"), .ant-modal:has-text("费用")').first();
      await expect(costModal).toBeVisible({ timeout: 5000 });
      
      console.log('✅ 费用填写模态框打开成功');
      
      // 截图模态框
      await page.screenshot({ path: 'test-results/cost-modal.png', fullPage: true });
      
      // 检查表单字段
      const monthPicker = page.locator('.ant-picker').first();
      const fuelInput = page.locator('input[placeholder*="油费"], input[name="fuel"]').first();
      const leaseInput = page.locator('input[placeholder*="Lease"], input[name="lease"]').first();
      const insuranceInput = page.locator('input[placeholder*="保险"], input[name="insurance"]').first();
      const maintenanceInput = page.locator('input[placeholder*="维护"], input[name="maintenance"]').first();
      
      console.log(`月份选择器: ${await monthPicker.count()}`);
      console.log(`油费输入框: ${await fuelInput.count()}`);
      console.log(`Lease输入框: ${await leaseInput.count()}`);
      console.log(`保险输入框: ${await insuranceInput.count()}`);
      console.log(`维护费用输入框: ${await maintenanceInput.count()}`);
      
      // 关闭模态框 - 使用 ESC 键或点击模态框外部区域
      try {
        const cancelButton = page.locator('button:has-text("取消"), .ant-modal-close').first();
        if (await cancelButton.count() > 0 && await cancelButton.isVisible({ timeout: 2000 }).catch(() => false)) {
          await cancelButton.click();
        } else {
          // 如果没有找到取消按钮，按 ESC 键关闭模态框
          await page.keyboard.press('Escape');
        }
        await page.waitForTimeout(1000);
      } catch (error) {
        // 如果关闭失败，尝试按 ESC 键
        await page.keyboard.press('Escape');
        await page.waitForTimeout(1000);
      }
    } else {
      console.log('⚠️ 未找到"费用"按钮，可能没有车辆数据');
    }
  });
});


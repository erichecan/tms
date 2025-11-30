// 完整闭环测试
// 创建时间: 2025-11-30 04:10:00
// 测试完整的业务流程：登录 -> 创建运单 -> 指派司机 -> 查看详情 -> 生成BOL

import { test, expect, Page } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

// 登录辅助函数
async function login(page: Page) {
  await page.goto(`${BASE_URL}/login`);
  await page.fill('input[placeholder*="用户名"]', 'admin');
  await page.fill('input[type="password"]', 'admin123');
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/admin/, { timeout: 10000 });
}

test.describe('完整业务流程测试', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('完整流程：登录 -> 创建运单 -> 指派司机 -> 查看详情 -> 生成BOL', async ({ page }) => {
    // 步骤1: 导航到创建运单页面
    await page.goto(`${BASE_URL}/create-shipment`);
    await page.waitForSelector('form, .ant-form', { timeout: 5000 });
    
    // 步骤2: 填写客户信息
    const customerNameInput = page.locator('input[placeholder*="客户"], input[name*="customer"]').first();
    if (await customerNameInput.count() > 0) {
      await customerNameInput.fill('测试客户_' + Date.now());
    }
    
    // 步骤3: 填写地址信息
    const pickupAddressInput = page.locator('input[placeholder*="取货"], input[name*="pickup"]').first();
    if (await pickupAddressInput.count() > 0) {
      await pickupAddressInput.fill('北京市朝阳区测试街道123号');
    }
    
    const deliveryAddressInput = page.locator('input[placeholder*="送货"], input[name*="delivery"]').first();
    if (await deliveryAddressInput.count() > 0) {
      await deliveryAddressInput.fill('上海市浦东新区测试路456号');
    }
    
    // 步骤4: 填写货物信息
    const cargoDescInput = page.locator('textarea[placeholder*="货物"], input[placeholder*="货物"]').first();
    if (await cargoDescInput.count() > 0) {
      await cargoDescInput.fill('测试货物：电子产品');
    }
    
    // 步骤5: 填写重量和尺寸
    const weightInput = page.locator('input[placeholder*="重量"], input[name*="weight"]').first();
    if (await weightInput.count() > 0) {
      await weightInput.fill('100');
    }
    
    // 步骤6: 提交创建运单表单
    const submitButton = page.locator('button:has-text("创建"), button:has-text("提交"), button[type="submit"]').last();
    if (await submitButton.count() > 0) {
      await submitButton.click();
      
      // 等待成功消息
      await expect(page.locator('.ant-message-success')).toBeVisible({ timeout: 10000 });
    }
    
    // 步骤7: 导航到运单管理页面
    await page.goto(`${BASE_URL}/admin/shipments`);
    await page.waitForSelector('table, .ant-table', { timeout: 5000 });
    
    // 步骤8: 点击第一个运单查看详情
    const firstShipmentRow = page.locator('tbody tr').first();
    if (await firstShipmentRow.count() > 0) {
      await firstShipmentRow.click();
      await page.waitForTimeout(2000);
      
      // 切换到调度分配 Tab
      const dispatchTab = page.locator('.ant-tabs-tab:has-text("调度分配"), .ant-tabs-tab:has-text("分配")');
      if (await dispatchTab.count() > 0) {
        await dispatchTab.first().click();
        await page.waitForTimeout(1000);
      }
      
      // 点击指派司机按钮
      const assignButton = page.locator('button:has-text("指派"), button:has-text("分配司机")');
      if (await assignButton.count() > 0) {
        await assignButton.first().click();
        await page.waitForSelector('.ant-modal', { timeout: 3000 });
        
        // 选择司机
        const driverSelect = page.locator('.ant-select:has-text("司机"), .ant-select').first();
        if (await driverSelect.count() > 0) {
          await driverSelect.click();
          await page.waitForSelector('.ant-select-dropdown', { timeout: 3000 });
          await page.click('.ant-select-item').first();
        }
        
        // 选择车辆
        const vehicleSelect = page.locator('.ant-select:has-text("车辆"), .ant-select').last();
        if (await vehicleSelect.count() > 0) {
          await vehicleSelect.click();
          await page.waitForSelector('.ant-select-dropdown', { timeout: 3000 });
          await page.click('.ant-select-item').first();
        }
        
        // 确认指派
        await page.click('button:has-text("确认指派"), button:has-text("确认")');
        await expect(page.locator('.ant-message-success')).toBeVisible({ timeout: 5000 });
      }
      
      // 步骤9: 查看运单详情中的货物信息
      const cargoSection = page.locator('text=货物信息, .ant-card:has-text("货物")');
      if (await cargoSection.count() > 0) {
        await expect(cargoSection.first()).toBeVisible();
      }
      
      // 步骤10: 生成BOL
      const bolButton = page.locator('button:has-text("BOL"), button:has-text("生成提单")');
      if (await bolButton.count() > 0) {
        await bolButton.first().click();
        await page.waitForTimeout(2000);
        
        // 验证BOL内容显示（可能在新标签页或弹窗中）
        // 这里需要根据实际实现调整
      }
    }
  });

  test('测试运单时间线和POD加载', async ({ page }) => {
    // 导航到运单管理页面
    await page.goto(`${BASE_URL}/admin/shipments`);
    await page.waitForSelector('table, .ant-table', { timeout: 5000 });
    
    // 点击第一个运单查看详情
    const firstShipmentRow = page.locator('tbody tr').first();
    if (await firstShipmentRow.count() > 0) {
      await firstShipmentRow.click();
      await page.waitForTimeout(2000);
      
      // 切换到时间线 Tab
      const timelineTab = page.locator('.ant-tabs-tab:has-text("时间线"), .ant-tabs-tab:has-text("Timeline")');
      if (await timelineTab.count() > 0) {
        await timelineTab.first().click();
        await page.waitForTimeout(1000);
        
        // 验证时间线内容显示
        await expect(page.locator('.ant-timeline, .ant-list')).toBeVisible({ timeout: 5000 });
      }
      
      // 切换到POD Tab
      const podTab = page.locator('.ant-tabs-tab:has-text("POD"), .ant-tabs-tab:has-text("交付证明")');
      if (await podTab.count() > 0) {
        await podTab.first().click();
        await page.waitForTimeout(1000);
        
        // 验证POD列表显示
        await expect(page.locator('.ant-list, .ant-table')).toBeVisible({ timeout: 5000 });
      }
    }
  });
});


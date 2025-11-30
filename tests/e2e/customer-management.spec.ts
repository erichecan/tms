// 客户管理功能测试
// 创建时间: 2025-11-30 04:00:00
// 测试客户管理的所有功能：创建、编辑、删除、查看详情、查看历史、查看财务

import { test, expect, Page } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000';

// 登录辅助函数
async function login(page: Page) {
  await page.goto(`${BASE_URL}/login`);
  await page.fill('input[placeholder*="用户名"]', 'admin');
  await page.fill('input[type="password"]', 'admin123');
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/admin/, { timeout: 10000 });
}

test.describe('客户管理功能测试', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto(`${BASE_URL}/admin/customers`);
    await page.waitForSelector('table, .ant-table', { timeout: 5000 });
  });

  test('1. 测试创建客户功能', async ({ page }) => {
    // 点击新建客户按钮
    await page.click('button:has-text("新建客户")');
    await page.waitForSelector('.ant-modal', { timeout: 3000 });

    // 填写客户信息
    await page.fill('input[placeholder*="客户姓名"]', '测试客户_' + Date.now());
    await page.fill('input[placeholder*="电话号码"]', `138${Math.floor(Math.random() * 100000000)}`);
    await page.fill('input[placeholder*="邮箱"]', `test${Date.now()}@example.com`);
    
    // 选择客户等级
    await page.click('.ant-select-selector:has-text("VIP")');
    await page.click('.ant-select-item:has-text("VIP2")');

    // 填写地址信息
    await page.fill('input[placeholder*="国家"]', '中国');
    await page.fill('input[placeholder*="省份"]', '北京市');
    await page.fill('input[placeholder*="城市"]', '北京市');
    await page.fill('input[placeholder*="邮编"]', '100000');
    await page.fill('input[placeholder*="详细地址"]', '测试街道123号');

    // 提交表单
    await page.click('button:has-text("确认")');
    
    // 等待成功消息
    await expect(page.locator('.ant-message-success')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=客户添加成功')).toBeVisible();
  });

  test('2. 测试查看客户详情功能', async ({ page }) => {
    // 查找第一个客户行
    const firstRow = page.locator('tbody tr').first();
    if (await firstRow.count() > 0) {
      // 点击查看详情按钮（眼睛图标）
      await firstRow.locator('button[title*="查看"], .anticon-eye-outlined').first().click();
      await page.waitForSelector('.ant-modal', { timeout: 3000 });
      
      // 验证详情弹窗显示
      await expect(page.locator('.ant-modal:has-text("客户详情")')).toBeVisible();
      
      // 关闭弹窗
      await page.click('button:has-text("关闭"), .ant-modal-close');
    }
  });

  test('3. 测试编辑客户功能', async ({ page }) => {
    // 查找第一个客户行
    const firstRow = page.locator('tbody tr').first();
    if (await firstRow.count() > 0) {
      // 点击编辑按钮
      await firstRow.locator('button[title*="编辑"], .anticon-edit-outlined').first().click();
      await page.waitForSelector('.ant-modal:has-text("编辑客户")', { timeout: 3000 });
      
      // 修改客户名称
      const nameInput = page.locator('input[placeholder*="客户姓名"]').first();
      const oldValue = await nameInput.inputValue();
      await nameInput.fill('修改后的客户名称_' + Date.now());
      
      // 提交编辑
      await page.click('button:has-text("确认")');
      
      // 等待成功消息
      await expect(page.locator('.ant-message-success')).toBeVisible({ timeout: 5000 });
      await expect(page.locator('text=客户更新成功')).toBeVisible();
    }
  });

  test('4. 测试查看客户历史功能', async ({ page }) => {
    // 查找第一个客户行
    const firstRow = page.locator('tbody tr').first();
    if (await firstRow.count() > 0) {
      // 点击查看历史按钮
      await firstRow.locator('button[title*="历史"], .anticon-history').first().click();
      await page.waitForSelector('.ant-modal', { timeout: 3000 });
      
      // 验证历史弹窗显示
      await expect(page.locator('.ant-modal:has-text("运单历史")')).toBeVisible({ timeout: 5000 });
      
      // 关闭弹窗
      await page.click('button:has-text("关闭"), .ant-modal-close');
    }
  });

  test('5. 测试查看客户财务信息功能', async ({ page }) => {
    // 查找第一个客户行
    const firstRow = page.locator('tbody tr').first();
    if (await firstRow.count() > 0) {
      // 点击查看财务按钮
      await firstRow.locator('button[title*="财务"], .anticon-dollar').first().click();
      await page.waitForSelector('.ant-modal', { timeout: 3000 });
      
      // 验证财务弹窗显示
      await expect(page.locator('.ant-modal:has-text("财务信息")')).toBeVisible({ timeout: 5000 });
      
      // 关闭弹窗
      await page.click('button:has-text("关闭"), .ant-modal-close');
    }
  });

  test('6. 测试删除客户功能', async ({ page }) => {
    // 查找第一个客户行
    const firstRow = page.locator('tbody tr').first();
    if (await firstRow.count() > 0) {
      // 点击删除按钮
      await firstRow.locator('button[title*="删除"], .anticon-delete-outlined').first().click();
      
      // 确认删除（如果是确认对话框）
      const confirmButton = page.locator('.ant-popconfirm button:has-text("确认"), button:has-text("确定"), button:has-text("OK")');
      if (await confirmButton.count() > 0) {
        await confirmButton.first().click();
      }
      
      // 等待成功消息
      await expect(page.locator('.ant-message-success')).toBeVisible({ timeout: 5000 });
      await expect(page.locator('text=删除成功')).toBeVisible();
    }
  });

  test('7. 测试客户搜索功能', async ({ page }) => {
    // 查找搜索框
    const searchInput = page.locator('input[placeholder*="搜索"], input[type="search"]').first();
    if (await searchInput.count() > 0) {
      await searchInput.fill('测试');
      await page.waitForTimeout(1000); // 等待搜索结果加载
      
      // 验证搜索结果
      const rows = page.locator('tbody tr');
      const count = await rows.count();
      expect(count).toBeGreaterThan(0);
    }
  });

  test('8. 测试客户筛选功能', async ({ page }) => {
    // 查找筛选下拉框
    const filterSelect = page.locator('.ant-select:has-text("状态"), .ant-select:has-text("等级")').first();
    if (await filterSelect.count() > 0) {
      await filterSelect.click();
      await page.waitForSelector('.ant-select-dropdown', { timeout: 3000 });
      
      // 选择筛选选项
      await page.click('.ant-select-item:has-text("VIP1")');
      await page.waitForTimeout(1000); // 等待筛选结果加载
    }
  });
});


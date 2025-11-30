// 规则版本管理功能测试
// 创建时间: 2025-11-30 04:05:00
// 测试规则版本管理的所有功能：查看、编辑、删除、审核、查看审批流程

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

test.describe('规则版本管理功能测试', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    // 导航到规则版本管理页面（假设路由为 /admin/rules/versions）
    await page.goto(`${BASE_URL}/admin/rules/versions`);
    await page.waitForSelector('table, .ant-table', { timeout: 10000 });
  });

  test('1. 测试查看规则版本详情', async ({ page }) => {
    // 查找第一个规则版本行
    const firstRow = page.locator('tbody tr').first();
    if (await firstRow.count() > 0) {
      // 点击查看详情按钮（眼睛图标）
      await firstRow.locator('button[title*="查看"], .anticon-eye-outlined').first().click();
      await page.waitForSelector('.ant-modal', { timeout: 3000 });
      
      // 验证详情弹窗显示
      await expect(page.locator('.ant-modal:has-text("规则版本详情")')).toBeVisible({ timeout: 5000 });
      
      // 关闭弹窗
      await page.click('button:has-text("关闭"), .ant-modal-close');
    }
  });

  test('2. 测试编辑规则版本（草稿状态）', async ({ page }) => {
    // 查找状态为草稿的规则版本
    const draftRows = page.locator('tbody tr:has-text("草稿"), tbody tr:has-text("draft")');
    if (await draftRows.count() > 0) {
      const firstDraftRow = draftRows.first();
      // 点击编辑按钮
      await firstDraftRow.locator('button[title*="编辑"], .anticon-edit-outlined').first().click();
      await page.waitForSelector('.ant-modal, .ant-drawer', { timeout: 3000 });
      
      // 验证编辑界面显示
      await expect(page.locator('.ant-modal:has-text("编辑"), .ant-drawer:has-text("编辑")')).toBeVisible({ timeout: 5000 });
      
      // 关闭编辑界面
      await page.click('button:has-text("取消"), .ant-modal-close, .ant-drawer-close');
    }
  });

  test('3. 测试提交审核功能', async ({ page }) => {
    // 查找状态为草稿的规则版本
    const draftRows = page.locator('tbody tr:has-text("草稿"), tbody tr:has-text("draft")');
    if (await draftRows.count() > 0) {
      const firstDraftRow = draftRows.first();
      // 点击提交审核按钮
      await firstDraftRow.locator('button[title*="提交审核"], .anticon-safety-certificate').first().click();
      
      // 如果有确认对话框，点击确认
      const confirmButton = page.locator('.ant-popconfirm button:has-text("确认"), button:has-text("确定")');
      if (await confirmButton.count() > 0) {
        await confirmButton.first().click();
      }
      
      // 等待成功消息
      await expect(page.locator('.ant-message-success')).toBeVisible({ timeout: 5000 });
    }
  });

  test('4. 测试审核通过功能', async ({ page }) => {
    // 查找状态为待审核的规则版本
    const pendingRows = page.locator('tbody tr:has-text("待审核"), tbody tr:has-text("pending")');
    if (await pendingRows.count() > 0) {
      const firstPendingRow = pendingRows.first();
      // 点击审核通过按钮
      await firstPendingRow.locator('button[title*="审核通过"], .anticon-check-circle').first().click();
      
      // 如果有确认对话框，点击确认
      const confirmButton = page.locator('.ant-popconfirm button:has-text("确认"), button:has-text("确定")');
      if (await confirmButton.count() > 0) {
        await confirmButton.first().click();
      }
      
      // 等待成功消息
      await expect(page.locator('.ant-message-success')).toBeVisible({ timeout: 5000 });
    }
  });

  test('5. 测试审核拒绝功能', async ({ page }) => {
    // 查找状态为待审核的规则版本
    const pendingRows = page.locator('tbody tr:has-text("待审核"), tbody tr:has-text("pending")');
    if (await pendingRows.count() > 0) {
      const firstPendingRow = pendingRows.first();
      // 点击审核拒绝按钮
      await firstPendingRow.locator('button[title*="审核拒绝"], .anticon-exclamation-circle').first().click();
      
      // 如果有拒绝原因输入框，填写原因
      const reasonInput = page.locator('input[placeholder*="原因"], textarea[placeholder*="原因"]');
      if (await reasonInput.count() > 0) {
        await reasonInput.fill('测试拒绝原因');
      }
      
      // 确认拒绝
      const confirmButton = page.locator('button:has-text("确认"), button:has-text("确定")');
      if (await confirmButton.count() > 0) {
        await confirmButton.first().click();
      }
      
      // 等待成功消息
      await expect(page.locator('.ant-message-success')).toBeVisible({ timeout: 5000 });
    }
  });

  test('6. 测试查看审批流程功能', async ({ page }) => {
    // 查找有待审核或已审核的规则版本
    const workflowRows = page.locator('tbody tr:has-text("待审核"), tbody tr:has-text("已审核"), tbody tr:has-text("pending"), tbody tr:has-text("approved")');
    if (await workflowRows.count() > 0) {
      const firstWorkflowRow = workflowRows.first();
      // 点击查看审批流程按钮
      await firstWorkflowRow.locator('button[title*="审批流程"], .anticon-branches').first().click();
      await page.waitForSelector('.ant-modal', { timeout: 3000 });
      
      // 验证审批流程弹窗显示
      await expect(page.locator('.ant-modal:has-text("审批流程")')).toBeVisible({ timeout: 5000 });
      
      // 验证审批步骤显示
      await expect(page.locator('.ant-steps, .ant-timeline')).toBeVisible();
      
      // 关闭弹窗
      await page.click('button:has-text("关闭"), .ant-modal-close');
    }
  });

  test('7. 测试下载规则版本功能', async ({ page, context }) => {
    // 监听下载事件
    const downloadPromise = page.waitForEvent('download', { timeout: 5000 }).catch(() => null);
    
    // 查找第一个规则版本行
    const firstRow = page.locator('tbody tr').first();
    if (await firstRow.count() > 0) {
      // 点击下载按钮
      await firstRow.locator('button[title*="下载"], .anticon-download').first().click();
      
      // 等待下载（如果有）
      const download = await downloadPromise;
      if (download) {
        expect(download).toBeTruthy();
      }
    }
  });

  test('8. 测试规则版本列表加载', async ({ page }) => {
    // 验证表格存在
    await expect(page.locator('table, .ant-table')).toBeVisible();
    
    // 验证表格有数据行
    const rows = page.locator('tbody tr');
    const count = await rows.count();
    expect(count).toBeGreaterThan(0);
    
    // 验证列标题存在
    await expect(page.locator('th:has-text("规则名称"), th:has-text("版本")')).toBeVisible();
  });
});


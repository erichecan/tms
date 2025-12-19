// 客户创建：空邮箱重复创建不应触发 500 / UNIQUE 冲突
// 创建时间：2025-12-19 12:00:00
// 目的：回归修复“空 email 被当成 '' 入库导致 UNIQUE(tenant_id, email) 冲突”的问题

import { test, expect } from '@playwright/test';

test.describe('客户创建（空邮箱）回归', () => {
  test('连续创建两个无邮箱客户应成功', async ({ page }) => {
    // 登录（复用现有登录页面元素）
    await page.goto('/login');
    await page.fill('input[placeholder*="用户名"]', 'admin');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/admin/, { timeout: 15_000 });

    // 进入客户管理页
    await page.goto('/admin/customers');
    await page.waitForSelector('table, .ant-table', { timeout: 10_000 });

    // 创建客户 #1（不填邮箱）
    await page.click('button:has-text("新建客户")');
    await page.waitForSelector('.ant-modal', { timeout: 5_000 });
    await page.fill('input[placeholder*="客户姓名"]', `无邮箱客户_A_${Date.now()}`);
    await page.click('button:has-text("确认")');
    await expect(page.locator('.ant-message-success')).toBeVisible({ timeout: 10_000 });

    // 创建客户 #2（不填邮箱）
    await page.click('button:has-text("新建客户")');
    await page.waitForSelector('.ant-modal', { timeout: 5_000 });
    await page.fill('input[placeholder*="客户姓名"]', `无邮箱客户_B_${Date.now()}`);
    await page.click('button:has-text("确认")');
    await expect(page.locator('.ant-message-success')).toBeVisible({ timeout: 10_000 });

    // 额外断言：不应出现 500 相关错误提示（兜底）
    await expect(page.locator('text=500')).toHaveCount(0);
    await expect(page.locator('text=Failed to create customer')).toHaveCount(0);
  });
});



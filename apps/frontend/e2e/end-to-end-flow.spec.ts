// 2025-11-11 10:15:05 新增：端到端冒烟测试脚本
import { test, expect } from '@playwright/test';

test.describe('TMS v1.0 端到端冒烟', () => {
  test('管理员创建运单并完成调度流程', async ({ page }) => {
    await test.step('登录管理后台', async () => {
      await page.goto('http://localhost:5173/login');
      await page.getByPlaceholder('邮箱').fill('admin@demo.tms-platform.com');
      await page.getByPlaceholder('密码').fill('password');
      await page.getByRole('button', { name: '登录' }).click();
      await expect(page).toHaveURL(/.*\/$/);
    });

    await test.step('创建新运单', async () => {
      await page.getByRole('button', { name: '创建运单' }).click();
      await page.getByPlaceholder('张三 / Ms. Zhang').fill('测试客户');
      await page.getByPlaceholder('+1 416 000 0000').first().fill('+1 416 111 2222');
      await page.getByPlaceholder('you@example.com').fill('qa@example.com');
      await page.getByPlaceholder('街道 + 门牌号').first().fill('100 Queen St W');
      await page.getByPlaceholder('街道 + 门牌号').nth(1).fill('200 King St W');
      await page.getByPlaceholder('Toronto').fill('Toronto');
      await page.getByPlaceholder('ON').first().fill('ON');
      await page.getByPlaceholder('Ottawa').fill('Ottawa');
      await page.getByPlaceholder('ON').nth(1).fill('ON');
      await page.getByPlaceholder('如：10托盘杂货，需尾板').fill('测试货物，10 箱');
      await page.getByRole('spinbutton', { name: '总重量 (kg)' }).fill('120');
      await page.getByRole('spinbutton', { name: '件数' }).fill('10');
      await page.getByRole('button', { name: '提交确认' }).click();
      await page.getByRole('button', { name: '提交运单' }).click();
      await expect(page.getByText('运单提交成功')).toBeVisible();
    });

    await test.step('在运单管理中指派司机', async () => {
      await page.goto('http://localhost:5173/admin/shipments');
      await page.getByRole('button', { name: '指派车辆/行程' }).first().click();
      await page.getByRole('button', { name: '挂载到行程' }).click();
      await expect(page.getByText('已挂载到行程')).toBeVisible();
    });

    await test.step('推进运单至送达并上传POD', async () => {
      await page.getByRole('button', { name: '编辑运单' }).first().click();
      await page.getByRole('button', { name: '推进到' }).first().click();
      await page.getByRole('button', { name: '推进到' }).first().click();
      await page.getByRole('button', { name: '推进到' }).first().click();
      await expect(page.getByText('运单状态已更新')).toBeVisible();
    });
  });
});


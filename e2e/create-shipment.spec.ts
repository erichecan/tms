import { test, expect } from '@playwright/test';

// 2025-09-26 09:00:45 端到端：创建运单最小流程（带控制台错误抓取）
test('create shipment minimal flow', async ({ page }) => {
  const consoleErrors: string[] = [];
  page.on('console', msg => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });

  await page.goto('/');
  await page.goto('/create-shipment');

  // 基础信息（使用更精确的占位符避免歧义）
  await page.getByLabel('客户姓名').fill('测试客户');
  await page.getByPlaceholder('请输入联系电话（如：+1-555-123-4567 或 13812345678）').fill('+1-555-123-4567');
  await page.locator('#customerEmail').fill('test@example.com');

  // 发货人
  await page.getByLabel('发货人姓名').fill('张三');
  await page.locator('#shipperCompany').fill('发货公司');
  await page.getByLabel('地址行1 (Address Line 1)').first().fill('1 King St');
  await page.getByLabel('城市 (City)').first().fill('Toronto');
  await page.getByLabel('省份/州 (Province/State)').first().fill('ON');
  await page.getByLabel('邮政编码 (Postal Code)').first().fill('M5H 1A1');
  await page.getByLabel('国家 (Country)').first().click();
  await page.getByRole('option', { name: '加拿大 (Canada)' }).first().click();
  await page.locator('#shipperPhone').fill('+1-555-111-2222');

  // 收货人
  await page.getByLabel('收货人姓名').fill('李四');
  await page.locator('#receiverCompany').fill('收货公司');
  await page.getByLabel('地址行1 (Address Line 1)').nth(1).fill('100 Queen St');
  await page.getByLabel('城市 (City)').nth(1).fill('Ottawa');
  await page.getByLabel('省份/州 (Province/State)').nth(1).fill('ON');
  await page.getByLabel('邮政编码 (Postal Code)').nth(1).fill('K1A 0A6');
  await page.getByLabel('国家 (Country)').nth(1).click();
  await page.getByRole('option', { name: '加拿大 (Canada)' }).nth(1).click();
  await page.locator('#receiverPhone').fill('+1-555-333-4444');

  // 日期（选择当日）
  await page.getByLabel('取货日期').click();
  await page.getByRole('gridcell', { selected: true }).first().click();
  await page.getByLabel('送达日期').click();
  await page.getByRole('gridcell', { selected: true }).nth(1).click();

  // 货物
  await page.getByLabel(/长度/).fill('30');
  await page.getByLabel(/宽度/).fill('20');
  await page.getByLabel(/高度/).fill('10');
  await page.getByLabel(/重量/).fill('5');
  await page.getByLabel('箱数/件数').fill('1');

  // 提交确认
  await page.getByRole('button', { name: '提交确认' }).click();
  await expect(page.getByText('确认运单信息')).toBeVisible();

  // 确认创建并等待响应
  const [resp] = await Promise.all([
    page.waitForResponse(r => r.url().includes('/api') || r.url().includes('/shipments')),
    page.getByRole('button', { name: '确认创建运单' }).click()
  ]);

  // 基础断言
  expect(resp.status()).toBeLessThan(500);

  if (consoleErrors.length) {
    console.log('Console errors during test:', consoleErrors);
  }
});



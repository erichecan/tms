// 2025-11-11T15:43:10Z Added by Assistant: Customer self-service regression coverage
import { test, expect } from '@playwright/test';

test.describe('客户自助服务中心', () => {
  test('客户可以填写在线下单表单', async ({ page }) => {
    await page.route('**/api/shipments', async (route) => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: { shipmentNumber: 'TMS-PORTAL-0001' }
          })
        });
      } else {
        await route.continue();
      }
    });

    await page.goto('/customer/portal');
    await expect(page.getByText('客户自助服务中心')).toBeVisible();

    await page.getByLabel('联系人姓名').fill('Portal Tester');
    await page.getByLabel('联系电话').fill('+1 416 555 0000');
    await page.getByLabel('联系邮箱').fill('portal@test.com');
    await page.getByLabel('收货人电话').fill('+1 905 555 0000');
    await page.getByLabel('取货地址').fill('123 Test Street');
    await page.getByLabel('送货地址').fill('500 Demo Road');
    await page.getByLabel('取货城市').fill('Toronto');
    await page.getByLabel('省份').first().fill('ON');
    await page.getByLabel('送货城市').fill('Ottawa');
    await page.getByLabel('省份').nth(1).fill('ON');
    await page.getByLabel('运单编号', { exact: false }).press('Tab'); // 确保焦点离开
    await page.getByLabel('货物描述').fill('5 pallets of mixed goods');
    await page.getByLabel('总重量 (kg)').fill('200');
    await page.getByLabel('件数').fill('5');
    await page.getByRole('button', { name: '提交运单' }).click();

    await expect(page.getByText('感谢提交！')).toBeVisible();
    await expect(page.getByText('TMS-PORTAL-0001')).toBeVisible();
  });

  test('客户可以查询运单状态', async ({ page }) => {
    await page.route('**/api/shipments**', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: [
              {
                shipmentNumber: 'TMS-PORTAL-0001',
                status: 'in_transit',
                pickupAddress: { city: 'Toronto', addressLine1: '123 Test Street' },
                deliveryAddress: { city: 'Ottawa', addressLine1: '500 Demo Road' },
                estimatedCost: 450,
                createdAt: '2025-11-11T10:00:00Z'
              }
            ]
          })
        });
      } else {
        await route.continue();
      }
    });

    await page.goto('/customer/portal');
    await page.getByRole('tab', { name: '运单查询' }).click();
    await page.getByLabel('运单编号').fill('TMS-PORTAL-0001');
    await page.getByLabel('下单电话').fill('+1 416 555 0000');
    await page.getByRole('button', { name: '查询运单' }).click();

    await expect(page.getByText('运单信息')).toBeVisible();
    await expect(page.getByText('in_transit')).toBeVisible();
    await expect(page.getByText('Toronto 123 Test Street')).toBeVisible();
  });
});


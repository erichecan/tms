import { test, expect } from '@playwright/test';
import { WaybillPage } from './pages/WaybillPage';

test.describe('Waybill Management', () => {
    test('Create Waybill - Happy Path', async ({ page }) => {
        const waybillPage = new WaybillPage(page);

        // 1. Intercept Network for deterministic result
        await page.route('**/api/waybills', async route => {
            await route.fulfill({ status: 200, body: JSON.stringify({ id: '123' }) });
        });

        // 2. Execute Action
        await waybillPage.gotoCreate();
        await waybillPage.switchToAmazonTemplate();
        await waybillPage.fillForm({ deliveryDate: '2026-01-20', address: '123 Warehouse Blvd' });
        await waybillPage.submit();

        // 3. Assert - we expect to be redirected to home/dashboard (which is '/') or waybills list
        // Based on code: navigate('/') on success
        await expect(page).toHaveURL(/\/$/);
    });
});

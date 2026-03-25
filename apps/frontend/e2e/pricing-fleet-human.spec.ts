/**
 * 定价页、车队司机/车辆表单：统一 humanFill（TMS_HUMAN_TYPING=1 时逐字输入）
 * — 2026-03-23T16:05:00
 */

import { test, expect } from '@playwright/test';
import { LoginPage } from './pages/LoginPage';
import { PricingFleetPage } from './pages/PricingFleetPage';

async function loginAsAdminMock(page: import('@playwright/test').Page) {
    await page.route('**/api/auth/login', async (route) => {
        await route.fulfill({
            status: 200,
            body: JSON.stringify({
                token: 'mock-jwt-pricing-fleet',
                user: {
                    id: 'U-PF-E2E',
                    name: 'Admin PF',
                    email: 'admin@tms.test',
                    roleId: 'R-ADMIN',
                },
                role: 'R-ADMIN',
                permissions: ['*'],
            }),
        });
    });
    const login = new LoginPage(page);
    await login.goto();
    await login.login('admin@tms.test', 'pass');
    await expect(page).not.toHaveURL(/\/login/, { timeout: 15000 });
}

test.describe('定价与车队表单 · humanFill', () => {
    test('定价页：起讫点与等待时间类人填写', async ({ page }) => {
        await loginAsAdminMock(page);
        const pf = new PricingFleetPage(page);
        await pf.gotoPricing();
        await pf.fillPricingFormHuman('100 King St, Toronto ON', '200 Queen St, Toronto ON', '12');
        await expect(page.getByTestId('pricing-pickup-input')).toHaveValue(/King/);
        await expect(page.getByTestId('pricing-delivery-input')).toHaveValue(/Queen/);
        await expect(page.getByTestId('pricing-waiting-input')).toHaveValue('12');
    });

    test('车队：新建司机弹窗类人填写并提交（Mock API）', async ({ page }) => {
        await page.route('**/api/drivers**', async (route) => {
            const req = route.request();
            if (req.method() === 'POST') {
                await route.fulfill({
                    status: 200,
                    body: JSON.stringify({ id: 'D-E2E-HUMAN', name: 'E2E Human Driver', status: 'IDLE' }),
                });
                return;
            }
            await route.fulfill({ status: 200, body: JSON.stringify({ data: [], total: 0, totalPages: 1, page: 1, limit: 10 }) });
        });
        await page.route('**/api/vehicles**', async (route) => {
            await route.fulfill({ status: 200, body: JSON.stringify({ data: [], total: 0 }) });
        });

        await loginAsAdminMock(page);
        const pf = new PricingFleetPage(page);
        await pf.gotoFleetTab('drivers');
        await pf.openAddFleetEntry();
        await expect(page.getByTestId('fleet-driver-name-input')).toBeVisible({ timeout: 10000 });
        await pf.fillNewDriverFormHuman({
            name: 'E2E Human Driver',
            phone: '4165550199',
            code: 'DE2EH',
            hourlyRate: '28.5',
        });
        await pf.submitFleetModal();
        await expect(page.getByTestId('fleet-driver-name-input')).toBeHidden({ timeout: 15000 });
    });

    test('车队：新建车辆弹窗类人填写并提交（Mock API）', async ({ page }) => {
        await page.route('**/api/vehicles**', async (route) => {
            const req = route.request();
            if (req.method() === 'POST') {
                await route.fulfill({
                    status: 200,
                    body: JSON.stringify({
                        id: 'V-E2E-HUMAN',
                        plate: 'E2E-HUMAN',
                        model: 'Human Test Truck',
                        status: 'IDLE',
                    }),
                });
                return;
            }
            await route.fulfill({ status: 200, body: JSON.stringify({ data: [], total: 0, totalPages: 1, page: 1, limit: 10 }) });
        });
        await page.route('**/api/drivers**', async (route) => {
            await route.fulfill({ status: 200, body: JSON.stringify({ data: [], total: 0 }) });
        });

        await loginAsAdminMock(page);
        const pf = new PricingFleetPage(page);
        await pf.gotoFleetTab('vehicles');
        await pf.openAddFleetEntry();
        await expect(page.getByTestId('fleet-vehicle-plate-input')).toBeVisible({ timeout: 10000 });
        await pf.fillNewVehicleFormHuman({
            plate: 'E2E-HUMAN',
            model: 'Human Test Truck',
            maxPallets: '13',
            capacity: '12.5',
        });
        await pf.submitFleetModal();
        await expect(page.getByTestId('fleet-vehicle-plate-input')).toBeHidden({ timeout: 15000 });
    });
});

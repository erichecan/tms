import { test, expect } from '@playwright/test';

test.describe('Customer Creation Reproduction', () => {
    test('should create a customer successfully', async ({ page }) => {
        // Login
        await page.goto('http://localhost:3000/login');
        await page.fill('input[placeholder="邮箱"]', 'mark@aponygroup.com');
        await page.fill('input[type="password"]', '27669');
        await page.click('button[type="submit"]');

        // Wait for redirect
        await page.waitForURL(url => url.pathname === '/' || url.pathname.includes('/admin'), { timeout: 15_000 });

        // Navigate to Customer Management
        await page.goto('http://localhost:3000/admin/customers');
        await page.waitForTimeout(2000);

        // === CREATE FIRST CUSTOMER ===
        const createBtn = page.locator('button', { hasText: '新增客户' }).first();
        await createBtn.waitFor({ state: 'visible', timeout: 10000 });
        await createBtn.click();

        await page.waitForSelector('.ant-modal', { timeout: 5_000 });

        const timestamp = Date.now();
        const customerName = `Test Customer ${timestamp}`;

        // Fill Basic Info (Using refined selectors targeting modal body)
        await page.fill('.ant-modal-body input[placeholder*="客户姓名"]', customerName);
        // Skipped email to test empty email scenario
        // await page.fill('.ant-modal-body input[placeholder*="example@email.com"]', ...);
        await page.fill('.ant-modal-body input[placeholder*="416-123-4567"]', '416-555-0199');

        // Fill Address Info
        await page.fill('.ant-modal-body input[placeholder*="123 Main Street"]', '123 Test St');
        await page.fill('.ant-modal-body input[placeholder*="Toronto"]', 'Toronto');
        await page.fill('.ant-modal-body input[placeholder*="A1A 1A1"]', 'M5V 2H1');

        // Submit
        await page.click('.ant-modal-footer .ant-btn-primary');

        // Verification 1
        await expect(page.locator('.ant-message-success')).toBeVisible({ timeout: 5000 });

        // Wait for modal to disappear
        await page.waitForSelector('.ant-modal', { state: 'hidden', timeout: 5000 });

        // === CREATE SECOND CUSTOMER (Duplicate empty email) ===
        await page.waitForTimeout(1000);
        const createBtn2 = page.locator('button', { hasText: '新增客户' }).first();
        await createBtn2.click();
        await page.waitForSelector('.ant-modal', { timeout: 5_000 });

        await page.fill('.ant-modal-body input[placeholder*="客户姓名"]', customerName + " 2");
        await page.fill('.ant-modal-body input[placeholder*="416-123-4567"]', '416-555-0199');
        await page.click('.ant-modal-footer .ant-btn-primary');

        // Verification 2: Should NOT fail (expect success)
        try {
            await expect(page.locator('.ant-message-success')).toBeVisible({ timeout: 5000 });
            console.log('Second customer created successfully');
        } catch (e) {
            console.log('Success message not found for second customer, checking for errors...');
            const errorMetrics = await page.locator('.ant-message-error').allTextContents();
            if (errorMetrics.length > 0) {
                console.error('Error creating second customer:', errorMetrics);
                throw new Error(`Customer creation failed: ${errorMetrics.join(', ')}`);
            }
            throw e; // Rethrow if no visible error message either
        }
    });
});

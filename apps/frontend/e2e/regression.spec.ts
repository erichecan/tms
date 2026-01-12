import { test, expect } from '@playwright/test';

// =============================================================================
// TMS 5.0 E2E Regression Suite
// Based on: 20260108_TMS_5.0_需求规格说明书.md
// =============================================================================

const BASE_URL = 'http://localhost:5173';

test.describe('P0: Workbench & Core Navigation', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto(BASE_URL);
    });

    test('Workbench: loads with core metrics and welcome message', async ({ page }) => {
        // 1. Verify Title/Welcome
        await expect(page.getByText(/TMS 5.1/i)).toBeVisible();

        // 2. Verify P0 Metrics - Using flexible locators for cards
        await expect(page.locator('body')).toContainText(/Welcome/i);

        // Check for critical dashboard elements
        await expect(page.getByRole('link', { name: /Dashboard/i })).toBeVisible();
    });

    test('Navigation: can switch between core modules', async ({ page }) => {
        // Click "Tracking Loop"
        const trackingLink = page.getByRole('link', { name: /Tracking/i }).first();
        await trackingLink.click();
        await expect(page).toHaveURL(/.*tracking/);

        // Click "Waybills"
        const waybillsLink = page.getByRole('link', { name: /Waybills/i }).first();
        await waybillsLink.click();
        await expect(page).toHaveURL(/.*waybills/);
    });
});

test.describe('P0: Waybill Lifecycle (Create & List)', () => {
    test('Create Waybill: validates Amazon Template fields & Pricing', async ({ page }) => {
        await page.goto(`${BASE_URL}/waybills/create`);

        // 0. Switch to Amazon Template
        await page.getByRole('button', { name: 'Amazon' }).click();

        // 1. Check for Amazon Template specific fields
        await expect(page.getByTestId('fc-alias-input')).toBeVisible();
        await expect(page.getByTestId('delivery-date-input')).toBeVisible();

        // 2. Fill Form (Mock)
        await page.getByTestId('fc-alias-input').fill('YYZ9');
        await page.getByTestId('delivery-date-input').fill('2026-01-08');

        // 3. Pricing (Simplified)
        await page.getByTestId('price-input').fill('150.50');

        // 4. Verify Submit Button is visible
        await expect(page.getByTestId('submit-waybill-btn')).toBeVisible();
    });

    test('Create Waybill: validates Default Template fields', async ({ page }) => {
        await page.goto(`${BASE_URL}/waybills/create`);

        // 0. Ensure Default Template is active (it is default, but good to be explicit or check)
        await expect(page.getByRole('button', { name: 'Default' })).toBeVisible();

        // 1. Check for Default Template specific fields
        await expect(page.getByText('SHIP FROM / PICK UP AT')).toBeVisible();
        await expect(page.getByText('SHIP TO / DELIVER TO')).toBeVisible();

        // 2. Fill Form
        await page.getByTestId('ship-from-address').fill('123 Origin St');
        await page.getByTestId('ship-to-address').fill('456 Dest Rd');
        await page.getByTestId('delivery-date-input').fill('2026-02-02'); // Shared

        // 3. Verify Pricing (Shared)
        await page.getByTestId('price-input').fill('500.00');


        // 4. Submit
        await page.getByTestId('submit-waybill-btn').click();
        await expect(page).toHaveURL(BASE_URL + '/');
    });
});

test.describe('P0: Tracking Loop (Single Page)', () => {
    // Use a known ID if possible, else rely on generic route or first item
    const MOCK_TRIP_ID = 'T-1001';

    test('Page Structure: verifies Map, Status, and Info Cards', async ({ page }) => {
        await page.goto(`${BASE_URL}/tracking/${MOCK_TRIP_ID}`);

        // 1. Map Component (Mock or Real)
        await expect(page.locator('body')).toContainText('Google Maps Mock');

        // 2. Status Bar / Badge
        await expect(page.locator('.badge')).toBeVisible();

        // 3. Info Cards
        await expect(page.locator('body')).toContainText(/In Transit/i);
    });

    test('Communication: can send a chat message', async ({ page }) => {
        await page.goto(`${BASE_URL}/tracking/${MOCK_TRIP_ID}`);
        const testMsg = `AutoTest_${Date.now()}`;

        // 1. Type Message
        const input = page.getByPlaceholder(/Type a message/i);
        await input.click();
        await input.fill(testMsg);

        // 2. Send
        await page.getByRole('button').filter({ has: page.locator('svg') }).last().click();

        // 3. Verify Message appears in list
        await expect(page.locator('body')).toContainText(testMsg);
    });
});

test.describe('P1: Fleet Management', () => {
    test('Fleet: loads tabs including new Schedule View', async ({ page }) => {
        await page.goto(`${BASE_URL}/fleet`);

        // 1. Click Schedule Tab
        await page.getByRole('button', { name: /Schedule/i }).click();

        // 2. Verify Calendar Grid Headers
        await expect(page.getByText('Mon')).toBeVisible();
        await expect(page.getByText('Sun')).toBeVisible();

        // 3. Verify Mock Task exists
        await expect(page.getByText('Trip TO-QC')).toBeVisible();
    });
});

import { test, expect } from '@playwright/test';

// Mock Data
const MOCK_WAYBILLS = [
    { id: '1', waybill_no: 'Y001', customer_id: 'CUST-A', status: 'NEW', created_at: '2026-01-01', origin: 'NY', destination: 'LA' },
    { id: '2', waybill_no: 'Y002', customer_id: 'CUST-B', status: 'IN_TRANSIT', created_at: '2026-01-02', origin: 'MIA', destination: 'CHI' },
    { id: '3', waybill_no: 'Y003', customer_id: 'CUST-A', status: 'DELIVERED', created_at: '2026-01-03', origin: 'TX', destination: 'WA' }
];

test.describe('Waybill List', () => {
    test.beforeEach(async ({ page }) => {
        // Mock the API call
        await page.route('**/api/waybills', async route => {
            await route.fulfill({ status: 200, body: JSON.stringify(MOCK_WAYBILLS) });
        });
        await page.goto('/waybills');
    });

    test('Loads and displays data', async ({ page }) => {
        await expect(page.getByTestId('waybill-row')).toHaveCount(3);
    });

    test('Filter by Search', async ({ page }) => {
        const searchInput = page.getByTestId('waybill-search-input');
        await searchInput.fill('Y002');

        await expect(page.getByTestId('waybill-row')).toHaveCount(1);
        await expect(page.getByText('Y002')).toBeVisible();
        await expect(page.getByText('Y001')).not.toBeVisible();
    });

    test('Filter by Status', async ({ page }) => {
        await page.getByTestId('filter-IN_TRANSIT').click();

        await expect(page.getByTestId('waybill-row')).toHaveCount(1);
        await expect(page.getByText('Y002')).toBeVisible();

        await page.getByTestId('filter-DELIVERED').click();
        await expect(page.getByTestId('waybill-row')).toHaveCount(1);
        await expect(page.getByText('Y003')).toBeVisible();
    });
});

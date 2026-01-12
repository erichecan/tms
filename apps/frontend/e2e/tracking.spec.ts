import { test, expect } from '@playwright/test';

// Mock Data
const MOCK_TRIP = {
    driver: { name: 'John Doe' },
    vehicle: { plate: 'ABC-123' },
    status: 'IN_TRANSIT',
    timeline: [],
    waybills: [],
    end_time_est: new Date().toISOString()
};

const MOCK_MESSAGES = [
    { id: 1, sender: 'DRIVER', text: 'Hello Dispatch' }
];

test.describe('Tracking Page', () => {
    test.beforeEach(async ({ page }) => {
        await page.route('**/api/trips/*/tracking', async route => {
            await route.fulfill({ status: 200, body: JSON.stringify(MOCK_TRIP) });
        });
        await page.route('**/api/trips/*/messages', async route => {
            if (route.request().method() === 'GET') {
                await route.fulfill({ status: 200, body: JSON.stringify(MOCK_MESSAGES) });
            } else {
                await route.fulfill({ status: 201, body: JSON.stringify({ success: true }) });
            }
        });
        await page.goto('/tracking/T-999');
    });

    test('Loads Tracking Info', async ({ page }) => {
        await expect(page.getByText('John Doe')).toBeVisible();
        await expect(page.getByText('Hello Dispatch')).toBeVisible();
    });

    test('Can Send Message', async ({ page }) => {
        // Simulate sending
        await page.getByTestId('chat-input').fill('Stay Safe');

        // Updates local state optimistically or via refetch? 
        // Code does: await post -> fetchMessages. 
        // We need to update our GET mock for the second call to verify full loop,
        // or just verify the input clears and POST was made.

        const postRequestPromise = page.waitForRequest(req =>
            req.url().includes('/messages') && req.method() === 'POST'
        );

        await page.getByTestId('send-message-btn').click();

        const request = await postRequestPromise;
        expect(request.postDataJSON()).toEqual({ text: 'Stay Safe' });

        await expect(page.getByTestId('chat-input')).toHaveValue('');
    });
});

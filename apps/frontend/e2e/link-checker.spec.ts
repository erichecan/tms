import { test, expect } from '@playwright/test';

const PAGES = ['/', '/waybills', '/settings', '/fleet', '/tracking', '/messages'];

test.describe('Global Health Check', () => {
    for (const url of PAGES) {
        test(`Scan interactions on ${url}`, async ({ page }) => {
            console.log(`\nScanning Page: ${url}`);
            await page.goto(url);

            // 1. Scan Links
            const links = await page.locator('a:visible').all();
            console.log(`  Found ${links.length} visible links`);

            for (const link of links) {
                const href = await link.getAttribute('href');
                const text = (await link.textContent())?.trim().substring(0, 20).replace(/\n/g, ' ');

                if (!href || href.startsWith('javascript') || href.startsWith('#')) {
                    continue;
                }

                if (href.startsWith('/')) {
                    process.stdout.write(`    [LINK] "${text}" -> ${href} ... `);

                    // Verify resource validity
                    const response = await page.request.get(href);
                    expect(response.status(), `Broken Link: ${href}`).toBeLessThan(400);
                    console.log('OK');
                }
            }

            // 2. Scan Buttons
            const buttons = await page.locator('button:visible').all();
            console.log(`  Found ${buttons.length} visible buttons`);

            for (const btn of buttons) {
                const text = (await btn.textContent())?.trim().substring(0, 20).replace(/\n/g, ' ');
                const isDisabled = await btn.isDisabled();
                console.log(`    [BUTTON] "${text || 'Icon'}" - ${isDisabled ? 'DISABLED' : 'ACTIVE'}`);
            }
        });
    }
});

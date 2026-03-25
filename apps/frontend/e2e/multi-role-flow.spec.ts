import { test, expect } from '@playwright/test';
import { humanFill } from './support/humanInteraction';
import { LoginPage } from './pages/LoginPage';
import { WaybillPage } from './pages/WaybillPage';
import { DriverPage } from './pages/DriverPage';

/** 与 apps/backend main.ts /api/test/reset-fleet-idle 一致（非 production）— 2026-03-23T12:22:00 */
const API_ORIGIN = process.env.TMS_E2E_API_ORIGIN || 'http://localhost:3001';

/**
 * End-to-End Multi-Role Flow（关键路径）
 * 1. 调度账号登录 Web
 * 2. 侧栏进入运单 → Default 模板创建一张新运单（不依赖集装箱批量生成/报价矩阵）
 * 3. 指派给种子司机 + 车辆
 * 4. 司机账号登录司机端（移动视口）
 * 5. 开始运输 → 确认签收
 *
 * 集装箱→批量运单链路见 ContainerManagement + seed-e2e；易因报价缺失生成 0 条，故本用例改为创建运单 — 2026-03-23T03:35:00
 */

test.describe('Multi-Role Operational Flow', () => {
    const DISPATCHER_EMAIL = 'e2e-dispatcher@tms.com';
    const DRIVER_EMAIL = 'e2e-driver@tms.com';
    /** 与 apps/backend/scripts/seed-e2e.ts 一致 — 2026-03-23T03:28:00 */
    const PASSWORD = 'e2e-pass-123';

    test('Full flow: create waybill → assign → driver delivers', async ({ browser, request }) => {
        test.setTimeout(120000);
        const reset = await request.post(`${API_ORIGIN}/api/test/reset-fleet-idle`);
        expect(reset.ok(), `reset-fleet-idle failed: ${reset.status()}`).toBeTruthy();

        // --- Role 1: Dispatcher ---
        const dispatcherPage = await browser.newPage();
        const loginPage = new LoginPage(dispatcherPage);
        const waybillPage = new WaybillPage(dispatcherPage);

        await loginPage.goto();
        await loginPage.login(DISPATCHER_EMAIL, PASSWORD);
        await expect(dispatcherPage).not.toHaveURL(/\/login/, { timeout: 15000 });

        await waybillPage.gotoWaybills();
        await waybillPage.clickCreateWaybill();
        await expect(dispatcherPage).toHaveURL(/\/waybills\/create/, { timeout: 10000 });
        await expect(dispatcherPage.getByTestId('template-default')).toBeVisible({ timeout: 10000 });
        await humanFill(dispatcherPage.getByTestId('ship-from-address'), 'E2E Origin St, Toronto');
        await humanFill(dispatcherPage.getByTestId('ship-to-address'), 'E2E Dest Ave, Mississauga');
        await humanFill(dispatcherPage.getByTestId('price-input'), '99.00');
        await dispatcherPage.getByTestId('submit-waybill-btn').click();
        await expect(dispatcherPage).toHaveURL(/\/waybills$/, { timeout: 15000 });

        const waybillRow = dispatcherPage.getByTestId('waybill-row').filter({ hasText: /E2E Origin|E2E Dest/i }).first();
        await expect(waybillRow).toBeVisible({ timeout: 20000 });
        const waybillNoRaw = await waybillRow.locator('td').first().innerText();
        const waybillNo = waybillNoRaw.replace(/\s+/g, ' ').trim().split(/\s+/).filter((w) => /^Y\d{2}|^WB-/i.test(w))[0] ?? waybillNoRaw.trim();
        console.log(`E2E Waybill: ${waybillNo}`);

        await waybillPage.assignWaybill(waybillNo, 'D-E2E-DRIVER', 'V-E2E-VEHICLE');
        await dispatcherPage.waitForTimeout(1500);

        await dispatcherPage.close();

        // --- Role 2: Driver ---
        // Create a new context for the driver (maybe mobile emulation)
        const driverContext = await browser.newContext({
            viewport: { width: 375, height: 812 },
            userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 13_2_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0.3 Mobile/15E148 Safari/604.1'
        });
        const driverBrowserPage = await driverContext.newPage();
        await driverBrowserPage.addInitScript(() => {
            (window as unknown as { __TMS_E2E_MOCK_SIGNATURE__?: boolean }).__TMS_E2E_MOCK_SIGNATURE__ = true;
        });
        const driverLoginPage = new LoginPage(driverBrowserPage);
        const driverPage = new DriverPage(driverBrowserPage);

        await driverLoginPage.goto();
        await driverLoginPage.login(DRIVER_EMAIL, PASSWORD);
        
        // Wait for Driver Home
        await expect(driverBrowserPage).toHaveURL(/.*driver/);

        // Select the assigned waybill
        await driverPage.selectWaybill(waybillNo);
        
        // Verify initial status
        await driverPage.verifyStatus('ASSIGNED');
        
        // Start mission
        await driverPage.startMission();
        await driverPage.verifyStatus('IN_TRANSIT');
        
        // Confirm delivery
        await driverPage.confirmDelivery();
        await driverPage.verifyStatus('DELIVERED');

        await driverBrowserPage.close();
        await driverContext.close();
    });
});

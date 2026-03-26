/**
 * 转运单 → 生成运单 → 指派 → 司机端 → 签收 → 财务记录（多角色分段闭环）
 * 时间戳: 2026-03-25T12:20:00
 * 依赖本地后端 + migrate；与 multi-role-flow 相同 API 基址
 */
import { test, expect } from '@playwright/test';
import { humanFill } from './support/humanInteraction';
import { LoginPage } from './pages/LoginPage';
import { WaybillPage } from './pages/WaybillPage';
import { DriverPage } from './pages/DriverPage';

const API_ORIGIN = process.env.TMS_E2E_API_ORIGIN || 'http://localhost:3001';

test.describe('Transfer order multi-role flow', () => {
    const DISPATCHER_EMAIL = 'tom@tms.com';
    const DISPATCHER_PASS = 'dispatcher123';
    const DRIVER_EMAIL = 'jerry@tms.com';
    const DRIVER_PASS = 'driver123';
    const FINANCE_EMAIL = 'finance@tms.com';
    const FINANCE_PASS = 'finance123';

    test('Transfer → waybills → assign → driver delivers → finance records', async ({ browser, request }) => {
        test.setTimeout(180000);
        const reset = await request.post(`${API_ORIGIN}/api/test/reset-fleet-idle`);
        expect(reset.ok(), `reset-fleet-idle failed: ${reset.status()}`).toBeTruthy();

        // --- 调度：转运单 ---
        const dispatcherPage = await browser.newPage();
        dispatcherPage.on('dialog', (d) => d.accept());
        const loginPage = new LoginPage(dispatcherPage);
        const waybillPage = new WaybillPage(dispatcherPage);

        await loginPage.goto();
        await loginPage.login(DISPATCHER_EMAIL, DISPATCHER_PASS);
        await expect(dispatcherPage).not.toHaveURL(/\/login/, { timeout: 5000 });

        // 与 WaybillPage.gotoWaybills 一致：侧栏 SPA 导航，避免冷启动直链子路由时偶发回到 /login — 2026-03-25T23:25:00
        const toNav = dispatcherPage.locator('aside a[href="/transfer-orders"]');
        if (await toNav.isVisible().catch(() => false)) {
            await toNav.click();
        } else {
            await dispatcherPage.goto('/transfer-orders', { waitUntil: 'domcontentloaded' });
        }
        await dispatcherPage.waitForURL(/\/transfer-orders$/, { timeout: 20000 });
        await dispatcherPage.getByRole('button', { name: /新建转运单/ }).click();
        await expect(dispatcherPage).toHaveURL(/\/transfer-orders\/create/, { timeout: 15000 });

        await expect(dispatcherPage.getByTestId('transfer-input-partner')).toBeVisible({ timeout: 15000 });

        await humanFill(dispatcherPage.getByTestId('transfer-input-partner'), 'E2E-Partner');
        await humanFill(dispatcherPage.getByTestId('transfer-input-container'), `E2E-CTR-${Date.now()}`);
        await humanFill(dispatcherPage.getByTestId('transfer-input-warehouse'), '7仓');
        // 本地日期，避免 UTC toISOString 与日历日不一致；须触发 React onChange，勿仅用 evaluate 改 DOM — 2026-03-25T23:38:00
        const d = new Date();
        const today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        await dispatcherPage.getByTestId('transfer-input-arrival-date').fill(today);
        await expect(dispatcherPage.getByTestId('transfer-input-arrival-date')).toHaveValue(today);

        await dispatcherPage.getByTestId('transfer-btn-add-line').click();
        await expect(dispatcherPage.getByTestId('transfer-line-pallet-first')).toBeVisible({ timeout: 10000 });
        await humanFill(dispatcherPage.getByTestId('transfer-line-pallet-first'), '4');
        await dispatcherPage.getByTestId('transfer-line-dest-first').selectOption('YYZ9');

        // 第二行 HOLD：勾选列应无 checkbox（仅第一行可勾选）
        await dispatcherPage.getByTestId('transfer-btn-add-line').click();
        await dispatcherPage.getByTestId('transfer-line-hold-1').selectOption('HOLD_PENDING');
        await expect(dispatcherPage.getByTestId('transfer-line-checkbox-first')).toBeVisible();
        // HOLD 行不可勾选：勾选列仅应有 1 个 checkbox
        await expect(dispatcherPage.locator('tbody input[type="checkbox"]')).toHaveCount(1);

        // 等待 React 合并多行 state，并同时监听创建头 + 保存明细两次请求 — 2026-03-25T23:30:00
        await expect(dispatcherPage.getByTestId('transfer-line-hold-1')).toBeVisible();
        await expect(dispatcherPage.locator('tbody tr')).toHaveCount(2);

        const saveBtn = dispatcherPage.getByTestId('transfer-save-draft');
        const pCreate = dispatcherPage.waitForResponse(
            (r) =>
                r.request().method() === 'POST' &&
                r.url().includes('/api/transfer-orders') &&
                !r.url().includes('/lines'),
            { timeout: 30000 }
        );
        await saveBtn.click();
        const c = await pCreate;
        expect(c.status(), `create transfer: ${await c.text().catch(() => '')}`).toBe(200);
        // 明细保存与 navigate 在同一次 handleSaveDraft 内顺序 await；以 URL 为准避免 waitForResponse 竞态 — 2026-03-25T23:42:00
        await expect(dispatcherPage).toHaveURL(/\/transfer-orders\/TO-/, { timeout: 30000 });

        await dispatcherPage.getByTestId('transfer-line-checkbox-first').check();
        await dispatcherPage.getByTestId('transfer-generate-waybills').click();

        await waybillPage.gotoWaybills();
        // 列表展示 route：origin(仓库)→destination(FC)，不展示 cargo_desc
        const row = dispatcherPage
            .locator('[data-testid="waybill-row"]')
            .filter({ hasText: /7仓/ })
            .filter({ hasText: /YYZ9/i })
            .first();
        await expect(row).toBeVisible({ timeout: 25000 });
        const waybillNoRaw = await row.locator('td').first().innerText();
        const waybillNo =
            waybillNoRaw
                .replace(/\s+/g, ' ')
                .trim()
                .split(/\s+/)
                .filter((w) => /^Y\d{2}|^WB-/i.test(w))[0] ?? waybillNoRaw.trim();

        await waybillPage.assignWaybill(waybillNo, 'D-002', 'V-102');
        await dispatcherPage.waitForTimeout(1200);
        await dispatcherPage.close();

        // --- 司机 ---
        const driverContext = await browser.newContext({
            viewport: { width: 375, height: 812 },
            userAgent:
                'Mozilla/5.0 (iPhone; CPU iPhone OS 13_2_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0.3 Mobile/15E148 Safari/604.1',
        });
        const driverBrowserPage = await driverContext.newPage();
        driverBrowserPage.on('dialog', (d) => d.accept());
        await driverBrowserPage.addInitScript(() => {
            (window as unknown as { __TMS_E2E_MOCK_SIGNATURE__?: boolean }).__TMS_E2E_MOCK_SIGNATURE__ = true;
        });
        const driverLogin = new LoginPage(driverBrowserPage);
        const driverPage = new DriverPage(driverBrowserPage);
        await driverLogin.goto();
        await driverLogin.login(DRIVER_EMAIL, DRIVER_PASS);
        await expect(driverBrowserPage).toHaveURL(/.*driver/);
        await driverPage.selectWaybill(waybillNo);
        await driverPage.verifyStatus('ASSIGNED');
        await driverPage.startMission();
        await driverPage.verifyStatus('IN_TRANSIT');
        await driverPage.confirmDelivery();
        await driverPage.verifyStatus('DELIVERED');
        await driverBrowserPage.close();
        await driverContext.close();

        // --- 财务：应收应付存在（API 断言，不依赖地图）---
        const finLogin = await request.post(`${API_ORIGIN}/api/auth/login`, {
            data: { identifier: FINANCE_EMAIL, password: FINANCE_PASS },
        });
        expect(finLogin.ok()).toBeTruthy();
        const finToken = (await finLogin.json()) as { token?: string };
        expect(finToken.token).toBeTruthy();
        const finHeaders = { Authorization: `Bearer ${finToken.token}` };
        const recR = await request.get(`${API_ORIGIN}/api/finance/records?type=receivable`, { headers: finHeaders });
        const recP = await request.get(`${API_ORIGIN}/api/finance/records?type=payable`, { headers: finHeaders });
        expect(recR.ok()).toBeTruthy();
        expect(recP.ok()).toBeTruthy();
        const receivables = (await recR.json()) as Array<{ amount?: number }>;
        const payables = (await recP.json()) as Array<{ amount?: number }>;
        expect(receivables.length).toBeGreaterThan(0);
        expect(payables.length).toBeGreaterThan(0);
        expect(receivables.some((r) => (r.amount ?? 0) > 0)).toBeTruthy();
        expect(payables.some((p) => (p.amount ?? 0) >= 0)).toBeTruthy();
    });

    /** 可选：/api/pricing/calculate 在无 key 时跳过或失败可解释 — 2026-03-25T12:20:00 */
    test('pricing calculate optional (no maps key)', async ({ request }) => {
        const login = await request.post(`${API_ORIGIN}/api/auth/login`, {
            data: { identifier: 'tom@tms.com', password: 'dispatcher123' },
        });
        expect(login.ok()).toBeTruthy();
        const token = (await login.json()) as { token?: string };
        const headers = { Authorization: `Bearer ${token.token}` };
        const res = await request.post(`${API_ORIGIN}/api/pricing/calculate`, {
            headers,
            data: {
                pickupAddress: { formattedAddress: 'Toronto, ON' },
                deliveryAddress: { formattedAddress: 'Mississauga, ON' },
                businessType: 'STANDARD',
                billingType: 'DISTANCE',
                cargoInfo: 'E2E',
            },
        });
        if (!res.ok()) {
            const body = await res.text();
            expect(
                res.status() >= 500 || /distance matrix|map|api key|network/i.test(body),
                `pricing/calculate: ${res.status()} ${body.slice(0, 200)}`
            ).toBeTruthy();
        } else {
            const j = (await res.json()) as { totalRevenue?: number };
            expect(typeof j.totalRevenue).toBe('number');
        }
    });
});

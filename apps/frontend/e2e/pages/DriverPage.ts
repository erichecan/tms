import { type Page, type Locator, expect } from '@playwright/test';

export class DriverPage {
    readonly page: Page;
    readonly statusText: Locator;
    readonly startMissionBtn: Locator;
    readonly deliveredSignBtn: Locator;

    constructor(page: Page) {
        this.page = page;
        this.statusText = page.getByTestId('waybill-status-text');
        this.startMissionBtn = page.getByTestId('start-mission-btn');
        this.deliveredSignBtn = page.getByTestId('delivered-sign-btn');
    }

    async gotoHome() {
        await this.page.goto('/driver');
    }

    async selectWaybill(waybillNo: string) {
        await this.page.getByTestId(`driver-waybill-card-${waybillNo}`).click();
    }

    /**
     * 司机页用 DialogContext：确认后还有一次 Success alert（I Understand），不关掉会挡住签收按钮 — 2026-03-23T12:28:00
     */
    async startMission() {
        await this.startMissionBtn.click();
        await this.page.getByRole('button', { name: /Confirm Action/i }).click();
        await this.page.getByRole('button', { name: /I Understand/i }).click();
    }

    /**
     * 签收：打开画板 → Confirm（E2E 下 SignaturePad 走 __TMS_E2E_MOCK_SIGNATURE__ 注入 PNG）→ 成功弹窗 — 2026-03-23T12:58:00
     */
    async confirmDelivery() {
        await this.deliveredSignBtn.click();
        await this.page.getByRole('button', { name: /Confirm Signature/i }).click();
        await this.page.getByRole('button', { name: /I Understand/i }).click({ timeout: 30000 });
    }

    async verifyStatus(expectedStatus: string) {
        await expect(this.statusText).toHaveText(expectedStatus);
    }
}

import { type Page, type Locator, expect } from '@playwright/test';
import { humanFill } from '../support/humanInteraction';

export class WaybillPage {
    readonly page: Page;
    readonly submitButton: Locator;
    readonly deliveryDateInput: Locator;
    readonly fcAddressInput: Locator;
    readonly containerSearchInput: Locator;
    readonly batchGenerateBtn: Locator;

    constructor(page: Page) {
        this.page = page;
        this.submitButton = page.getByTestId('submit-waybill-btn');
        this.deliveryDateInput = page.getByTestId('delivery-date-input');
        this.fcAddressInput = page.getByTestId('fc-address-input');
        this.containerSearchInput = page.getByTestId('container-search-input');
        this.batchGenerateBtn = page.getByTestId('batch-generate-waybills-btn');
    }

    async gotoCreate() {
        await this.page.goto('/waybills/create');
    }

    async switchToAmazonTemplate() {
        await this.page.getByRole('button', { name: 'Amazon' }).click();
    }

    async fillForm(data: { deliveryDate: string; address: string }) {
        await humanFill(this.deliveryDateInput, data.deliveryDate);
        await humanFill(this.fcAddressInput, data.address);
    }

    async submit() {
        await this.submitButton.click();
    }

    // Container Management
    /**
     * 进入转运管理页。避免 page.goto('/containers')：AuthContext 首帧 isAuthenticated 仍为 false 时
     * ProtectedRoute 会误判未登录并踢回 /login（2026-03-23T03:32:00）
     */
    async gotoContainers() {
        const nav = this.page.locator('aside a[href="/containers"]');
        if (await nav.isVisible().catch(() => false)) {
            await nav.click();
        } else {
            await this.page.goto('/containers', { waitUntil: 'domcontentloaded' });
        }
        await this.page.waitForURL(/\/containers/, { timeout: 15000 });
        await this.page.getByTestId('container-search-input').waitFor({ state: 'visible', timeout: 15000 });
    }

    /** 受控输入 + 列表重拉易触发 detach，用逐字输入并等待列表稳定 — 2026-03-23T03:30:00 */
    async searchContainer(containerNo: string) {
        const input = this.page.getByTestId('container-search-input');
        await input.click();
        await input.clear();
        await input.pressSequentially(containerNo, { delay: 30 });
        await this.page.keyboard.press('Enter');
        await this.page.getByText('加载中...').waitFor({ state: 'hidden', timeout: 20000 }).catch(() => {});
        await this.page.waitForTimeout(400);
    }

    async selectContainer(containerNo: string) {
        await this.page.getByTestId(`container-row-${containerNo}`).click();
    }

    async batchGenerateWaybills() {
        // Mock alert for simplicity in E2E if needed, but here we just click
        this.page.once('dialog', dialog => dialog.accept());
        await this.batchGenerateBtn.click();
    }

    // Waybill Assignment（同 gotoContainers，避免冷启动 ProtectedRoute 误判 — 2026-03-23T03:33:00）
    async gotoWaybills() {
        const nav = this.page.locator('aside a[href="/waybills"]');
        const listResp = this.page.waitForResponse(
            (r) =>
                r.request().method() === 'GET' &&
                /\/api\/waybills(\?|$)/.test(new URL(r.url()).pathname),
            { timeout: 25000 }
        );
        if (await nav.isVisible().catch(() => false)) {
            await nav.click();
        } else {
            await this.page.goto('/waybills', { waitUntil: 'domcontentloaded' });
        }
        await this.page.waitForURL(
            (u) => {
                const p = new URL(u).pathname.replace(/\/$/, '') || '/';
                return p.endsWith('/waybills');
            },
            { timeout: 15000 }
        );
        await listResp.catch(() => {});
    }

    /**
     * 列表页根节点有 fadeIn，Playwright 默认等「布局稳定」会一直重试直至超时；force 跳过该检查 — 2026-03-23T12:15:00
     */
    async clickCreateWaybill() {
        await this.page.getByTestId('create-waybill-btn').click({ force: true });
    }

    /**
     * 与 WaybillsList 指派弹窗一致（data-testid）。
     * 若下拉中不存在给定 driverId/vehicleId（种子 ID 与线上 drivers 表不一致时常见），则选第一个非空选项 — 2026-03-23T03:38:00
     */
    async assignWaybill(waybillNo: string, driverId: string, vehicleId: string) {
        const token = waybillNo.trim();
        const row = this.page.locator('tr').filter({ hasText: token }).first();
        await row.getByTestId('waybill-row-menu-btn').click();
        await this.page.getByTestId('assign-waybill-btn').click();
        await expect(this.page.getByTestId('assign-driver-select')).toBeVisible({ timeout: 10000 });
        await this.page.waitForTimeout(600);
        const dSel = this.page.getByTestId('assign-driver-select');
        const vSel = this.page.getByTestId('assign-vehicle-select');
        const optCount = async (sel: import('@playwright/test').Locator, id: string) =>
            sel.locator(`option[value="${id}"]`).count();
        if ((await optCount(dSel, driverId)) > 0) {
            await dSel.selectOption(driverId);
        } else {
            const byE2eName = await dSel.evaluate((el: HTMLSelectElement) => {
                for (const o of Array.from(el.options)) {
                    if (o.value && (o.textContent || '').includes('E2E Driver')) return o.value;
                }
                return '';
            });
            if (byE2eName) {
                await dSel.selectOption(byE2eName);
            } else {
                const dVal = await dSel.evaluate((el: HTMLSelectElement) => {
                    const o = Array.from(el.options).find((x) => x.value);
                    return o?.value ?? '';
                });
                if (!dVal) throw new Error('assign-driver-select has no options');
                await dSel.selectOption(dVal);
            }
        }
        if ((await optCount(vSel, vehicleId)) > 0) {
            await vSel.selectOption(vehicleId);
        } else {
            const byPlate = await vSel.evaluate((el: HTMLSelectElement) => {
                for (const o of Array.from(el.options)) {
                    if (o.value && (o.textContent || '').includes('E2E-PLATE')) return o.value;
                }
                return '';
            });
            if (byPlate) {
                await vSel.selectOption(byPlate);
            } else {
                const vVal = await vSel.evaluate((el: HTMLSelectElement) => {
                    const o = Array.from(el.options).find((x) => x.value);
                    return o?.value ?? '';
                });
                if (!vVal) throw new Error('assign-vehicle-select has no options');
                await vSel.selectOption(vVal);
            }
        }
        await this.page.getByTestId('assign-confirm-btn').click();
        await expect(this.page.getByTestId('assign-driver-select')).toBeHidden({ timeout: 20000 });
    }
}

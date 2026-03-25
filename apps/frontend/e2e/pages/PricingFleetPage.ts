import type { Page } from '@playwright/test';
import { humanFill } from '../support/humanInteraction';

/**
 * 定价计算器 + 车队司机/车辆弹窗表单的类人输入封装 — 2026-03-23T16:05:00
 * 依赖页面 data-testid（PricingCalculator / FleetManagement / DriverForm / VehicleForm）
 */
export class PricingFleetPage {
    constructor(readonly page: Page) {}

    async gotoPricing() {
        await this.page.goto('/pricing');
        await this.page.getByTestId('pricing-pickup-input').waitFor({ state: 'visible', timeout: 15000 });
    }

    async fillPricingFormHuman(pickup: string, delivery: string, waitingMinutes: string) {
        await humanFill(this.page.getByTestId('pricing-pickup-input'), pickup);
        await humanFill(this.page.getByTestId('pricing-delivery-input'), delivery);
        await humanFill(this.page.getByTestId('pricing-waiting-input'), waitingMinutes);
    }

    async gotoFleetTab(tab: 'drivers' | 'vehicles') {
        await this.page.goto('/fleet');
        const label = tab === 'drivers' ? /Drivers|司机/i : /Vehicles|车辆/i;
        await this.page.getByRole('button', { name: label }).first().click();
    }

    async openAddFleetEntry() {
        await this.page.getByTestId('fleet-add-entry-btn').click();
    }

    async fillNewDriverFormHuman(data: { name: string; phone: string; code: string; hourlyRate: string }) {
        await humanFill(this.page.getByTestId('fleet-driver-name-input'), data.name);
        await humanFill(this.page.getByTestId('fleet-driver-phone-input'), data.phone);
        await humanFill(this.page.getByTestId('fleet-driver-code-input'), data.code);
        await humanFill(this.page.getByTestId('fleet-driver-hourly-rate-input'), data.hourlyRate);
    }

    async fillNewVehicleFormHuman(data: { plate: string; model: string; maxPallets: string; capacity: string }) {
        await humanFill(this.page.getByTestId('fleet-vehicle-plate-input'), data.plate);
        await humanFill(this.page.getByTestId('fleet-vehicle-model-input'), data.model);
        await humanFill(this.page.getByTestId('fleet-vehicle-max-pallets-input'), data.maxPallets);
        await humanFill(this.page.getByTestId('fleet-vehicle-capacity-input'), data.capacity);
    }

    async submitFleetModal() {
        await this.page.getByRole('button', { name: /Confirm Registration|确认注册/ }).click();
    }
}

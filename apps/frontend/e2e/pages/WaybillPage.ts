import { type Page, type Locator, expect } from '@playwright/test';

export class WaybillPage {
    readonly page: Page;
    readonly submitButton: Locator;
    readonly deliveryDateInput: Locator;
    readonly fcAddressInput: Locator;

    constructor(page: Page) {
        this.page = page;
        this.submitButton = page.getByTestId('submit-waybill-btn');
        this.deliveryDateInput = page.getByTestId('delivery-date-input');
        this.fcAddressInput = page.getByTestId('fc-address-input');
    }

    async gotoCreate() {
        await this.page.goto('/waybills/create');
    }

    async switchToAmazonTemplate() {
        await this.page.getByRole('button', { name: 'Amazon' }).click();
    }

    async fillForm(data: { deliveryDate: string, address: string }) {
        await this.deliveryDateInput.fill(data.deliveryDate);
        await this.fcAddressInput.fill(data.address);
    }

    async submit() {
        await this.submitButton.click();
    }
}

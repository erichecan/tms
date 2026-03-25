import { type Page, type Locator, expect } from '@playwright/test';
import { humanFill } from '../support/humanInteraction';

export class LoginPage {
    readonly page: Page;
    readonly emailInput: Locator;
    readonly passwordInput: Locator;
    readonly signInButton: Locator;

    constructor(page: Page) {
        this.page = page;
        this.emailInput = page.getByPlaceholder(/Email|Username/i);
        this.passwordInput = page.getByPlaceholder(/password/i);
        this.signInButton = page.getByRole('button', { name: /Sign In|Authenticating/i });
    }

    async goto() {
        await this.page.goto('/login');
    }

    /** 账号密码写入统一走 humanFill（见 e2e/support/humanInteraction.ts）— 2026-03-23T15:12:00 */
    async login(email: string, pass: string) {
        await humanFill(this.emailInput, email);
        await humanFill(this.passwordInput, pass);
        await this.signInButton.click();
        // Wait for navigation away from login
        await expect(this.page).toHaveURL(/\/(?!login)/, { timeout: 15000 });
    }
}

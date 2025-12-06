//Every page class will extend this.

//We can add smart retries, element wrappers, and logging here.

import { expect, Page } from '@playwright/test';

export default class BasePage {

    constructor(public page: Page) {}

    locator(selector: string) {
        return this.page.locator(selector);
    }

    async navigateTo(url: string) {
        await this.page.goto(url);
    }

    async click(selector: string) {
        await this.page.locator(selector).waitFor({ state: 'visible' });
        await this.page.locator(selector).click();
    }

    async type(selector: string, text: string) {
        await this.page.locator(selector).waitFor({ state: 'visible' });
        await this.page.locator(selector).fill(text);
    }

    async waitForUrl(urlPart: string) {
        await expect(this.page).toHaveURL(new RegExp(urlPart));
    }

    async waitForPageLoad() {
        await this.page.waitForLoadState('load');
        await this.page.waitForLoadState('networkidle');
    }
   
}
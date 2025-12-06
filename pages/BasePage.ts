//Every page class will extend this.

//We can add smart retries, element wrappers, and logging here.

import { Page } from '@playwright/test';

export default class BasePage {

    constructor(public page: Page) {}

    async navigateTo(url: string) {
        await this.page.goto(url);
    }

    // async clickElement(selector: string) {
    //     await this.page.locator(selector).click();
    // }

    // async typeText(selector: string, text: string) {
    //     await this.page.locator(selector).fill(text);
    // }
   
}
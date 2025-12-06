import { Locator, Page } from '@playwright/test';
import BasePage from './BasePage';


export class LoginPage extends BasePage {

    private inputUsername = "//input[@id='userEmail']";
    private inputPassword = "//input[@id='userPassword']";
    private btnLogin = "//input[@id='login']";

    async login(username: string, password: string) {
        await this.type(this.inputUsername, username);
        await this.type(this.inputPassword, password);
        await this.click(this.btnLogin);
        await this.waitForPageLoad();
    }

    async isLoggedIn(): Promise<boolean> {
        const title = await this.page.title();
        return title.includes("Let's Shop");
    }

    async expectLoginErrorMessage(expectedMessage: string): Promise<boolean> {
        const errorMessageLocator: Locator = this.page.locator("//div[@class='alert alert-danger alert-dismissible']");
        const actualMessage = await errorMessageLocator.textContent();
        return actualMessage?.trim() === expectedMessage;
    }


}
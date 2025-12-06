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
    }
}
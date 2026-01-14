import { expect } from "@playwright/test";
import { test } from "../fixtures/auth.fixture";
import { LoginPage } from "../pages/LoginPage";
import { Header } from "../pages/components/Header";
import { getUser } from "../data/test-data";



test.describe.serial('Login Tests', () => {

    let loginPage: LoginPage;
    let headerPage: Header;

    test.beforeEach(async ({ page }) => {
        loginPage = new LoginPage(page);
        headerPage = new Header(page);
    });

    test.afterEach(async ({ page }) => {
        page.close();
    });

    test('should not be able to login with invalid credentials @TC-001', async ({ page }) => {
        await loginPage.navigateTo('client/#/auth/login');
        console.log("Current URL:- "+page.url());
        console.log("I'm in 1st Test");
        await loginPage.login('invalidUser@gmail.com', 'invalidPass');
        //TODO: Have assertion on toast message
    });

    test('should be login and navigate to dashboard @TC-002', async () => {
        await loginPage.navigateTo('client/#/auth/login');
        const user = getUser();
        await loginPage.login(user.email, user.password);
        await loginPage.waitForUrl('dashboard');
        console.log("I'm in 2nd Test");
        await expect(loginPage.page).toHaveTitle("Let's Shop");
    });

});
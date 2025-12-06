import { expect } from "@playwright/test";
import { test } from "../fixtures/auth.fixture";
import { LoginPage } from "../pages/LoginPage";
import { Header } from "../pages/components/Header";

let loginPage: LoginPage;
let headerPage: Header;

test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    headerPage = new Header(page);
});

test('should not be able to login with invalid credentials', async ({ page }) => {
    await loginPage.navigateTo('');
    await loginPage.login('invalidUser@gmail.com', 'invalidPass');
    //TODO: Have assertion on toast message
});

test('should be login and navigate to dashboard', async ({page}) => {
    await loginPage.navigateTo('');
    await loginPage.login('bobadesagarwd@gmail.com', 'Pass@123');
    await loginPage.waitForUrl('dashboard');
    await expect(loginPage.page).toHaveTitle("Let's Shop");
});
import { expect } from "@playwright/test";
import { test } from "../fixtures/auth.fixture";
import { LoginPage } from "../pages/LoginPage";

let loginPage: LoginPage;

test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
});

test.skip('has title', async ({ page }) => {
  await page.goto('https://playwright.dev/');
  await expect(page).toHaveTitle(/Playwright/);
});

test('sample test', async ({ page }) => {
    await page.goto('https://rahulshettyacademy.com/client/#/auth/login');
    await loginPage.login('bobadesagarwd@gmail.com', 'Pass@123');
    await expect(page).toHaveTitle("Let's Shop");
});
import { expect } from "@playwright/test";
import { test } from "../../fixtures/auth.fixture";
import { LoginPage } from "../../pages/LoginPage";
import { Header } from "../../pages/components/Header";
import { getUser } from "../../data/test-data";



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

    /**
     * Test case for customer login with invalid credentials
     * @jira SHOP-1234
     * @priority P0
     * @feature user-authentication
     * @description Verifies that the e-commerce platform prevents unauthorized access when users attempt to login with incorrect credentials and displays appropriate error messages
     */
    test('Verify Invalid Login Shows Error Message @TC-001', {
        tag: ['@regression', '@auth', '@security']}, async () => {
        await loginPage.navigateTo('client/#/auth/login');
        await loginPage.login('invalid.user@example.com', 'WrongPassword123');
        await expect(loginPage.page.locator('.error-message')).toBeVisible();
        await expect(loginPage.page.locator('.error-message')).toHaveText(/Invalid credentials/);
    });

    /**
     * Test case for customer profile access after successful login
     * @jira SHOP-1567
     * @priority P1
     * @feature customer-profile
     * @description Validates that logged-in customers can access their profile page to view and edit personal information, order history, and saved addresses
     */
    test.skip('Verify Customer Can Access Profile After Login @TC-002', {
        tag: ['@smoke', '@profile', '@user-management']}, async () => {
        await loginPage.navigateTo('client/#/auth/login');
        const user = getUser();
        await loginPage.login(user.email, user.password);
        await headerPage.navigateToProfile();
        await expect(loginPage.page).toHaveTitle(/My Profile - ShopEase/);
        await expect(loginPage.page.locator('.profile-name')).toBeVisible();
        await expect(loginPage.page.locator('.profile-email')).toContainText(user.email);
    });

    /**
     * Test case for successful customer login and dashboard redirection
     * @jira SHOP-1890
     * @priority P0
     * @feature user-authentication
     * @description Verifies that customers with valid credentials can successfully login to the e-commerce platform and are redirected to the main shopping dashboard with personalized recommendations
     */
    test('Verify Successful Login Redirects To Shopping Dashboard @TC-003', {
        tag: ['@smoke', '@auth', '@critical']}, async () => {
        await loginPage.navigateTo('client/#/auth/login');
        const user = getUser();
        await loginPage.login(user.email, user.password);
        await loginPage.waitForUrl('dashboard');
        await expect(loginPage.page).toHaveTitle(/ShopEase - Online Shopping/);
        await expect(loginPage.page.locator('.welcome-banner')).toBeVisible();
        await expect(loginPage.page.locator('.product-recommendations')).toBeVisible();
    });

});
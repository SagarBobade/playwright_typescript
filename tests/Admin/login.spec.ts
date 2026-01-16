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
     * Test case for admin portal authentication and access control
     * @jira SHOP-2456
     * @priority P0
     * @feature admin-authentication
     * @description Verifies that admin users can successfully authenticate and access the admin dashboard with full inventory management, order processing, and analytics capabilities
     */
    test('Verify Admin Login And Dashboard Access @TC-004', {
        tag: ['@smoke', '@admin', '@critical']}, async ({ page }) => {
            await loginPage.navigateTo('admin/#/auth/login');
            await loginPage.login('admin@shopease.com', 'AdminSecure@2024');
            await expect(page).toHaveURL(/admin\/dashboard/);
            await expect(page).toHaveTitle(/Admin Dashboard - ShopEase/);
            await expect(page.locator('.admin-panel')).toBeVisible();
            await expect(page.locator('.total-orders-widget')).toBeVisible();
            await expect(page.locator('.revenue-chart')).toBeVisible();
    });

    /**
     * Test case for admin session termination and secure logout
     * @jira SHOP-2789
     * @priority P1
     * @feature admin-security
     * @description Validates that admin users can securely logout from the admin panel, session is terminated properly, and attempting to access admin pages redirects to login screen
     */
    test.skip('Verify Admin Logout Terminates Session Securely @TC-005', {
        tag: ['@regression', '@admin', '@security']}, async ({ page }) => {
            await loginPage.navigateTo('admin/#/auth/login');
            await loginPage.login('admin@shopease.com', 'AdminSecure@2024');
            await expect(page).toHaveURL(/admin\/dashboard/);
            await headerPage.clickLogout();
            await expect(page).toHaveURL(/auth\/login/);
            await page.goBack();
            await expect(page).toHaveURL(/auth\/login/);
    });

});
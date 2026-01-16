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
     * Test case for admin login functionality
     * @jira SHOW-6888
     * @priority P1
     * @feature authentication
     * @description Validates that admin user can successfully login with valid credentials
     * @expectedResult Admin user is logged in and redirected to admin dashboard
     */
    test('Admin Login Test - Updated @TC-004', {
        tag: ['@smoke', '@auth', '@admin']}, async ({ page }) => {
            await loginPage.navigateTo('client/#/auth/login');
            console.log("Current URL:- "+page.url());
            console.log("I'm in 1st Test");
            await loginPage.login('invalidUser@gmail.com', 'invalidPass');
            //TODO: Have assertion on toast message
    });

    /**
     * for case
     * @jira SHOW-6889
     * @priority P0
     * @feature registration
     * @tags registration,positive,security
     */
    test.skip('Test from Admin logout @TC-005', {
        tag: ['@smoke', '@auth']}, async ({ page }) => {
            await loginPage.navigateTo('client/#/auth/login');
            console.log("Current URL:- "+page.url());
            console.log("I'm in 1st Test");
            await loginPage.login('invalidUser@gmail.com', 'invalidPass');
            //TODO: Have assertion on toast message
    });

});
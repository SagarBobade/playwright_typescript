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
     * Test case for invalid login credentials
     * @jira SHOW-6959
     * @priority P2
     * @feature authentication
     * @description Verifies that the system prevents login with incorrect username and password combination
     * @expectedResult Error toast message is displayed and user stays on login page
     */
    test('Invalid Login Credentials Test @TC-001', {
        tag: ['@regression', '@auth', '@negative']}, async () => {
        await loginPage.navigateTo('client/#/auth/login');
        //console.log("Current URL:- "+page.url());
        console.log("I'm in 1st Test");
        await loginPage.login('invalidUser@gmail.com', 'invalidPass');
        //TODO: Have assertion on toast message
    });

    // @priority P3
    // @feature profile
    test.skip('should be login and navigate to Profile @TC-002', {
        tag: ['@smoke', '@user']}, async () => {
        await loginPage.navigateTo('client/#/auth/login');
        const user = getUser();
        await loginPage.login(user.email, user.password);
        await loginPage.waitForUrl('dashboard');
        console.log("I'm in 2nd Test");
        await expect(loginPage.page).toHaveTitle("Let's Shop");
        await expect(loginPage.page).toHaveURL(/dashboard/);
    });

    // @priority P1
    // @feature user-dashboard
    test('should be login and navigate to dashboard @TC-003', {
        tag: ['@regression', '@auth']}, async () => {
        await loginPage.navigateTo('client/#/auth/login');
        const user = getUser();
        await loginPage.login(user.email, user.password);
        await loginPage.waitForUrl('dashboard');
        console.log("I'm in 3rd Test");
        await expect(loginPage.page).toHaveTitle("Let's Shop");
    });

});
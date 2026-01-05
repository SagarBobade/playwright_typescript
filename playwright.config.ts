import { defineConfig, devices } from '@playwright/test';

const ENV = process.env.ENV || "dev";   

export default defineConfig({
  testDir: './tests',
  timeout: 30 * 1000,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ["list"], // console summary
    // ['allure-playwright', {
    //   resultsDir: 'allure-results',
    //   detail: true,
    //   suiteTitle: true
    // }],
    ['monocart-reporter', {
      name: 'Hybrid Playwright Report',
      outputFile: 'reports/monocart-report.html'
    }]
  ],
  use: {
    baseURL: 'https://rahulshettyacademy.com/',
    trace: 'on-first-retry',
    channel: 'chrome',
    headless: false,
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    viewport: { width: 1280, height: 720 }, 
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    }
  ],
});

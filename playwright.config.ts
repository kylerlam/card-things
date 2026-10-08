import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: 'list',
  use: { baseURL: 'http://127.0.0.1:4173', trace: 'retain-on-failure' },
  projects: [
    { name: 'content', testMatch: ['**/content.spec.ts', '**/brand-config.spec.ts'] },
    {
      name: 'desktop-chromium',
      testIgnore: ['**/content.spec.ts', '**/brand-config.spec.ts', '**/static-deployment.spec.ts'],
      use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 1000 } },
    },
    {
      name: 'mobile-chromium',
      testIgnore: ['**/content.spec.ts', '**/brand-config.spec.ts', '**/static-deployment.spec.ts'],
      use: { ...devices['Pixel 7'], viewport: { width: 390, height: 844 } },
    },
    {
      name: 'desktop-firefox',
      testIgnore: ['**/content.spec.ts', '**/brand-config.spec.ts', '**/static-deployment.spec.ts'],
      use: { ...devices['Desktop Firefox'], viewport: { width: 1440, height: 1000 } },
    },
    {
      name: 'desktop-webkit',
      testIgnore: ['**/content.spec.ts', '**/brand-config.spec.ts', '**/static-deployment.spec.ts'],
      use: { ...devices['Desktop Safari'], viewport: { width: 1440, height: 1000 } },
    },
    {
      name: 'mobile-webkit',
      testIgnore: ['**/content.spec.ts', '**/brand-config.spec.ts', '**/static-deployment.spec.ts'],
      use: { ...devices['iPhone 13'] },
    },
  ],
  webServer: {
    command: 'npm run dev -- --port 4173 --strictPort',
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: !process.env.CI,
  },
});

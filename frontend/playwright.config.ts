import { defineConfig, devices } from '@playwright/test';

const PORT = 3000;
const BASE_URL = `http://127.0.0.1:${PORT}`;

export default defineConfig({
  testDir: './e2e',
  timeout: 60000,
  fullyParallel: false,
  expect: {
    timeout: 10000,
  },
  retries: process.env.CI ? 1 : 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    viewport: { width: 1440, height: 900 },
  },
  webServer: {
    command: 'npm start',
    port: PORT,
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
    env: {
      DISABLE_ESLINT_PLUGIN: 'true',
    },
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});

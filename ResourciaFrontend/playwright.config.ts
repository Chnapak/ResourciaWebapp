import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30_000,
  reporter: [['list']],
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? 'http://127.0.0.1:4200',
    trace: 'on-first-retry',
  },
  webServer: {
    command: 'npm run start -- --host 127.0.0.1 --port 4200',
    url: 'http://127.0.0.1:4200',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});

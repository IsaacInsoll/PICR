import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './',
  testMatch: ['*.smoke.spec.ts'],
  fullyParallel: false,
  retries: 0,
  workers: 1,
  timeout: 60_000,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: 'http://localhost:6901',
    trace: 'retain-on-failure',
    video: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  globalSetup: './globalSetup.ts',
  globalTeardown: './globalTeardown.ts',
});

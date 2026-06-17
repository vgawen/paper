import { defineConfig } from '@playwright/test';

// Per-test JS coverage attribution requires Chromium + serial execution.
export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [['list']],
  use: {
    baseURL: 'http://localhost:5179',
    trace: 'off',
  },
  webServer: {
    command: 'node demo-app/server.mjs',
    port: 5179,
    reuseExistingServer: true,
    stdout: 'ignore',
    stderr: 'pipe',
  },
  projects: [{ name: 'chromium', use: { browserName: 'chromium' } }],
});

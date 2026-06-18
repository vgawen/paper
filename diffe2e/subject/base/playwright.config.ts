import { defineConfig } from '@playwright/test';

// Serial run + CDP coverage per test for clean attribution.
export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 8000,
  expect: { timeout: 2500 },
  reporter: [['list'], ['json', { outputFile: process.env.PW_JSON || 'pw-report.json' }]],
  use: { baseURL: 'http://localhost:5181', trace: 'off', actionTimeout: 2500, navigationTimeout: 4000 },
  webServer: {
    command: 'node app/server.mjs',
    port: 5181,
    reuseExistingServer: true,
    stdout: 'ignore',
    stderr: 'pipe',
  },
  projects: [{ name: 'chromium', use: { browserName: 'chromium' } }],
});

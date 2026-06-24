import { defineConfig } from '@playwright/test';

// Serial + per-test CDP coverage, like the main subject. reuseExistingServer
// is FALSE so every `playwright test` invocation gets a FRESH backend state
// (visits=0): this is what makes the side-effect / subset-fidelity comparison
// meaningful — a selected subset that drops the state-producer test will see
// an un-primed backend.
export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 8000,
  expect: { timeout: 2500 },
  reporter: [['list'], ['json', { outputFile: process.env.PW_JSON || 'pw-report.json' }]],
  use: { baseURL: 'http://localhost:5182', trace: 'off', actionTimeout: 2500, navigationTimeout: 4000 },
  webServer: {
    command: 'node app/server.mjs',
    port: 5182,
    reuseExistingServer: false,
    stdout: 'ignore',
    stderr: 'pipe',
  },
  projects: [{ name: 'chromium', use: { browserName: 'chromium' } }],
});

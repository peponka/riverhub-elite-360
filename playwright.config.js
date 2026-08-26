// @ts-check
const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests/e2e',
  timeout: 30000,
  retries: 1,
  use: {
    baseURL: 'http://localhost:4001',
    headless: true,
    screenshot: 'only-on-failure',
    trace: 'on-first-retry',
  },
  webServer: {
    command: process.platform === 'win32'
      ? 'powershell -NoProfile -Command "$env:PORT=4001; node app.js"'
      : 'PORT=4001 node app.js',
    port: 4001,
    timeout: 30000,
    reuseExistingServer: true,
  },
  projects: [
    {
      name: 'chromium',
      use: { browserName: 'chromium' },
    },
  ],
});

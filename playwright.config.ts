import { defineConfig, devices } from '@playwright/test';

const PORT = 4174;
const isCi = process.env.CI !== undefined;

/**
 * Layout tests for the site, run against the static files exactly as they
 * ship: no bundler, no build. What they measure — whether three type sizes
 * share a baseline, whether a header fits across a phone — is invisible to
 * anything without a layout engine.
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: isCi,
  retries: isCi ? 1 : 0,
  reporter: isCi ? [['github'], ['html', { open: 'never' }]] : [['list']],
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'website',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 900 } },
    },
  ],
  webServer: {
    command: `node scripts/serve.mjs ${PORT}`,
    url: `http://localhost:${PORT}/index.html`,
    reuseExistingServer: !isCi,
    timeout: 30_000,
  },
});

import path from 'node:path';
import { defineConfig, devices } from '@playwright/test';
import { testEnv } from './tests/utils/env';

const backendScript = path
  .relative(testEnv.backendDir, path.join(testEnv.frontendDir, 'tests', 'utils', 'start-backend.mjs'))
  .replaceAll('\\', '/');

const webServer = [
  testEnv.startBackend
    ? {
        command: `node "${backendScript}"`,
        cwd: testEnv.backendDir,
        url: testEnv.backendHealthURL,
        timeout: 240_000,
        reuseExistingServer: testEnv.useExistingServers,
      }
    : undefined,
  testEnv.startFrontend
    ? {
        command: 'npx vite --host localhost --port 5173',
        cwd: testEnv.frontendDir,
        url: `${testEnv.baseURL}/login`,
        timeout: 120_000,
        reuseExistingServer: testEnv.useExistingServers,
      }
    : undefined,
].filter(Boolean);

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 1,
  workers: process.env.CI ? 2 : undefined,
  timeout: 60_000,
  reportSlowTests: {
    max: 10,
    threshold: 30_000,
  },
  outputDir: testEnv.artifactsDir,
  globalSetup: './tests/global.setup.ts',
  use: {
    baseURL: testEnv.baseURL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 15_000,
    navigationTimeout: 20_000,
  },
  reporter: [
    ['list'],
    ['html', { outputFolder: testEnv.htmlReportDir, open: 'never' }],
    ['json', { outputFile: testEnv.jsonReportPath }],
    ['./tests/reporters/markdownBugReporter.ts', { outputFile: testEnv.markdownReportPath }],
  ],
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
      },
    },
    {
      name: 'mobile-chrome',
      use: {
        ...devices['Pixel 7'],
      },
    },
  ],
  webServer,
});

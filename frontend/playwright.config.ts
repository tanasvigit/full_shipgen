import { defineConfig, devices } from "@playwright/test";
import dotenv from "dotenv";
import path from "path";

const rootDir = process.cwd();

dotenv.config({ path: path.join(rootDir, "e2e", ".env") });
dotenv.config({ path: path.join(rootDir, ".env"), override: false });

const baseURL = process.env.E2E_BASE_URL || "http://localhost:5173";
const apiURL = process.env.E2E_API_URL || process.env.VITE_API_HOST || "http://localhost:8000";
const authFile = path.join(rootDir, "playwright", ".auth", "user.json");
const slowMo =
  process.env.E2E_SLOW_MO != null
    ? Number(process.env.E2E_SLOW_MO)
    : process.env.npm_lifecycle_event === "test:e2e:fleetops:headed"
      ? 700
      : 0;

const isDay4ApiRun = process.env.npm_lifecycle_event === "test:e2e:day4";

export default defineConfig({
  testDir: path.join(rootDir, "e2e"),
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  timeout: 90_000,
  expect: { timeout: 20_000 },
  reporter: [
    ["list"],
    ["html", { open: "never", outputFolder: "playwright-report" }],
    ["json", { outputFile: "playwright-report/results.json" }],
  ],
  use: {
    baseURL,
    headless: false,
    viewport: { width: 1440, height: 900 },
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    actionTimeout: 20_000,
    navigationTimeout: 45_000,
    locale: "en-US",
    timezoneId: "UTC",
    launchOptions: {
      slowMo,
    },
  },
  metadata: {
    apiURL,
  },
  outputDir: path.join(rootDir, "test-results"),
  projects: [
    {
      name: "setup",
      testMatch: /.*\.setup\.ts/,
      timeout: 120_000,
      use: {
        headless: false,
        ...devices["Desktop Chrome"],
      },
    },
    {
      name: "chromium",
      testIgnore: [
        /auth\.setup\.ts/,
        /auth\/login\.spec\.ts/,
        /auth\/guest\.spec\.ts/,
        /tests\/e2e\/fleetops\//,
      ],
      dependencies: ["setup"],
      use: {
        ...devices["Desktop Chrome"],
        storageState: authFile,
        headless: false,
      },
    },
    {
      name: "chromium-fleetops-day1",
      testDir: path.join(rootDir, "tests/e2e"),
      testMatch: /fleetops\/.*\.spec\.ts/,
      dependencies: ["setup"],
      use: {
        ...devices["Desktop Chrome"],
        storageState: authFile,
        headless: false,
      },
    },
    {
      name: "chromium-fleetops-day4",
      testDir: path.join(rootDir, "tests/e2e"),
      testMatch: /fleetops\/mobile-integration\.spec\.ts/,
      use: {
        trace: "off",
        video: "off",
        screenshot: "off",
      },
    },
    {
      name: "chromium-guest",
      testMatch: [/auth\/login\.spec\.ts/, /auth\/guest\.spec\.ts/],
      use: {
        ...devices["Desktop Chrome"],
        storageState: { cookies: [], origins: [] },
        headless: false,
      },
    },
  ],
  webServer: isDay4ApiRun
    ? undefined
    : {
        command: process.env.E2E_WEB_COMMAND || "npm run dev",
        url: baseURL,
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
        stdout: "pipe",
        stderr: "pipe",
      },
});

import { defineConfig, devices } from "@playwright/test";
import dotenv from "dotenv";
import path from "path";

/**
 * Dedicated Playwright config for producing a narrated screen recording of a
 * FleetOps flow (create -> dispatch -> track). Kept separate from the main
 * e2e config so it never interferes with the normal test suite.
 *
 * Run:  npx playwright test --config=playwright.video.config.ts
 */
const rootDir = process.cwd();

dotenv.config({ path: path.join(rootDir, "e2e", ".env") });
dotenv.config({ path: path.join(rootDir, ".env"), override: false });

const baseURL = process.env.E2E_BASE_URL || "http://localhost:5173";
const authFile = path.join(rootDir, "playwright", ".auth", "user.json");

export default defineConfig({
  testDir: path.join(rootDir, "e2e-video"),
  fullyParallel: false,
  forbidOnly: false,
  retries: 0,
  workers: 1,
  timeout: 240_000,
  expect: { timeout: 20_000 },
  reporter: [["list"]],
  outputDir: path.join(rootDir, "e2e-video-results"),
  use: {
    baseURL,
    headless: true,
    viewport: { width: 1440, height: 900 },
    trace: "off",
    screenshot: "off",
    // Record video for every test in this config, regardless of pass/fail.
    video: { mode: "on", size: { width: 1440, height: 900 } },
    actionTimeout: 25_000,
    navigationTimeout: 45_000,
    locale: "en-US",
    timezoneId: "UTC",
    launchOptions: {
      // Slow motion makes the recording easy to follow.
      slowMo: Number(process.env.E2E_VIDEO_SLOW_MO ?? 350),
    },
  },
  projects: [
    {
      name: "setup",
      testDir: path.join(rootDir, "e2e"),
      testMatch: /auth\.setup\.ts/,
      timeout: 120_000,
      use: {
        ...devices["Desktop Chrome"],
        headless: true,
        video: "off",
      },
    },
    {
      name: "video",
      testMatch: /order-lifecycle\.video\.spec\.ts/,
      // No hard dependency on setup: reuse the previously saved auth state so
      // the recording works even when interactive credentials are not set.
      use: {
        ...devices["Desktop Chrome"],
        storageState: authFile,
      },
    },
    {
      name: "fleetops-full",
      testMatch: /fleetops-workflow\.video\.spec\.ts/,
      // Fresh context (no storageState) so the login flow is recorded.
      use: {
        ...devices["Desktop Chrome"],
        storageState: { cookies: [], origins: [] },
      },
    },
  ],
  webServer: {
    command: process.env.E2E_WEB_COMMAND || "npm run dev",
    url: baseURL,
    reuseExistingServer: true,
    timeout: 120_000,
    stdout: "pipe",
    stderr: "pipe",
  },
});

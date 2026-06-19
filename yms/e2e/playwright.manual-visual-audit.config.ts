import { defineConfig } from "@playwright/test";
import path from "path";

const FRONTEND_URL = process.env.YMS_FRONTEND_URL || "http://localhost:3001";

/**
 * Human-visible QA audit — always headed, slow, recorded.
 * Run: npx playwright test tests/manual-visual-audit.spec.ts --headed
 * Or:  npm run manual-visual-audit
 */
export default defineConfig({
  testDir: "./tests",
  testMatch: ["**/manual-visual-audit.spec.ts"],
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 3_600_000,
  expect: { timeout: 20_000 },
  reporter: [
    ["list"],
    ["html", { outputFolder: "playwright-report-visual", open: "never" }],
  ],
  use: {
    baseURL: FRONTEND_URL,
    headless: false,
    video: "on",
    screenshot: "on",
    trace: "retain-on-failure",
    viewport: { width: 1920, height: 1080 },
    launchOptions: {
      slowMo: 1000,
      args: ["--start-maximized"],
    },
    actionTimeout: 20_000,
    navigationTimeout: 60_000,
    locale: "en-US",
  },
  projects: [
    {
      name: "chromium",
      use: {
        browserName: "chromium",
        channel: "chrome",
      },
    },
  ],
  outputDir: "test-results/manual-visual-audit-artifacts",
});

export const VISUAL_AUDIT_PATHS = {
  root: path.join(__dirname, "playwright-manual-visual-audit"),
  screenshots: path.join(__dirname, "playwright-manual-visual-audit", "screenshots"),
};

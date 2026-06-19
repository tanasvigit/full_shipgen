import { defineConfig, devices } from "@playwright/test";
import path from "path";

const FRONTEND_URL = process.env.YMS_FRONTEND_URL || "http://localhost:3001";
const API_URL = process.env.YMS_API_URL || "http://localhost:8001";

export default defineConfig({
  testDir: "./tests",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 900_000,
  expect: { timeout: 15_000 },
  reporter: [
    ["list"],
    ["html", { outputFolder: "playwright-report", open: "never" }],
    ["json", { outputFile: "test-results/playwright-results.json" }],
  ],
  use: {
    baseURL: FRONTEND_URL,
    trace: "retain-on-failure",
    screenshot: "off",
    video: "off",
    actionTimeout: 12_000,
    navigationTimeout: 45_000,
    locale: "en-US",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  outputDir: "test-results/artifacts",
  globalTeardown: "./global-teardown.ts",
  metadata: {
    frontendUrl: FRONTEND_URL,
    apiUrl: API_URL,
  },
});

export const PATHS = {
  resultsJson: path.join(__dirname, "audit-results.json"),
  screenshotsDir: path.join(__dirname, "screenshots"),
  reportMd: path.join(__dirname, "..", "..", "PLAYWRIGHT_AUDIT_REPORT.md"),
};

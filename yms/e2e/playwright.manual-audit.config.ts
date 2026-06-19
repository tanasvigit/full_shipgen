import { defineConfig, devices } from "@playwright/test";
import path from "path";

const FRONTEND_URL = process.env.YMS_FRONTEND_URL || "http://localhost:3001";
const API_URL = process.env.YMS_API_URL || "http://localhost:8001";

/** Headed visual manual QA audit — screenshots, video, CSV artifacts. */
export default defineConfig({
  testDir: "./tests",
  testMatch: ["**/manual-audit.spec.ts"],
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 3_600_000,
  expect: { timeout: 20_000 },
  reporter: [
    ["list"],
    ["html", { outputFolder: "playwright-report-manual", open: "never" }],
    ["json", { outputFile: "test-results/manual-audit-results.json" }],
  ],
  use: {
    baseURL: FRONTEND_URL,
    headless: process.env.MANUAL_AUDIT_HEADLESS === "1",
    trace: "retain-on-failure",
    screenshot: "off",
    video: "on",
    actionTimeout: 15_000,
    navigationTimeout: 60_000,
    locale: "en-US",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  outputDir: "test-results/manual-audit-artifacts",
  globalTeardown: "./manual-audit-global-teardown.ts",
  metadata: {
    frontendUrl: FRONTEND_URL,
    apiUrl: API_URL,
    suite: "manual-audit",
  },
});

export const MANUAL_AUDIT_PATHS = {
  root: path.join(__dirname, "playwright-manual-audit"),
  screenshots: path.join(__dirname, "playwright-manual-audit", "screenshots"),
  videos: path.join(__dirname, "playwright-manual-audit", "videos"),
  stateJson: path.join(__dirname, "playwright-manual-audit", "audit-state.json"),
  finalReport: path.join(__dirname, "playwright-manual-audit", "final-manual-audit.md"),
};

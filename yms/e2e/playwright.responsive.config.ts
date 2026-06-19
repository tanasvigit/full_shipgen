import { defineConfig, devices } from "@playwright/test";
import path from "path";

const FRONTEND_URL = process.env.YMS_FRONTEND_URL || "http://localhost:3001";

export default defineConfig({
  testDir: "./tests",
  testMatch: "responsive-audit.spec.ts",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 1_800_000,
  expect: { timeout: 15_000 },
  reporter: [
    ["list"],
    ["html", { outputFolder: "playwright-report-responsive", open: "never" }],
    ["json", { outputFile: "test-results/responsive-audit-results.json" }],
  ],
  use: {
    baseURL: FRONTEND_URL,
    trace: "retain-on-failure",
    screenshot: "off",
    video: "off",
    actionTimeout: 12_000,
    navigationTimeout: 45_000,
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  outputDir: "test-results/responsive-artifacts",
});

export const RESPONSIVE_PATHS = {
  screenshotsDir: path.join(__dirname, "screenshots", "responsive"),
  reportJson: path.join(__dirname, "responsive-audit-results.json"),
  reportMd: path.join(__dirname, "..", "RESPONSIVE_AUDIT_REPORT.md"),
};

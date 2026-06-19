import { defineConfig, devices } from "@playwright/test";
import path from "path";

const FRONTEND_URL = process.env.YMS_FRONTEND_URL || "http://localhost:3001";
const API_URL = process.env.YMS_API_URL || "http://localhost:8001";

const VISUAL_ROOT = path.join(__dirname, "..", "..", "playwright-visual-audit");

export const VISUAL_PATHS = {
  root: VISUAL_ROOT,
  screenshots: path.join(VISUAL_ROOT, "screenshots"),
  videos: path.join(VISUAL_ROOT, "videos"),
  artifacts: path.join(VISUAL_ROOT, "artifacts"),
  resultsJson: path.join(VISUAL_ROOT, "visual-audit-results.json"),
  consoleLog: path.join(VISUAL_ROOT, "console-errors.log"),
  networkLog: path.join(VISUAL_ROOT, "network-errors.log"),
  uiFindings: path.join(VISUAL_ROOT, "ui-findings.md"),
  finalReport: path.join(VISUAL_ROOT, "final-audit-report.md"),
};

export default defineConfig({
  testDir: "./tests",
  testMatch: "visual-audit.spec.ts",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 1_200_000,
  expect: { timeout: 20_000 },
  reporter: [["list"]],
  use: {
    baseURL: FRONTEND_URL,
    headless: false,
    video: "on",
    trace: "off",
    screenshot: "off",
    actionTimeout: 15_000,
    navigationTimeout: 60_000,
    locale: "en-US",
    launchOptions: {
      slowMo: 80,
    },
  },
  projects: [{ name: "chromium-headed", use: { ...devices["Desktop Chrome"] } }],
  outputDir: VISUAL_PATHS.artifacts,
  globalTeardown: "./global-visual-teardown.ts",
  metadata: { frontendUrl: FRONTEND_URL, apiUrl: API_URL },
});

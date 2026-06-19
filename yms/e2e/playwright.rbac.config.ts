import { defineConfig, devices } from "@playwright/test";
import path from "path";

const FRONTEND_URL = process.env.YMS_FRONTEND_URL || "http://localhost:3001";
const API_URL = process.env.YMS_API_URL || "http://localhost:8001";

/** Dedicated config for parallel RBAC audit — does not affect other E2E suites. */
export default defineConfig({
  testDir: "./tests",
  testMatch: [
    "**/auth-audit.spec.ts",
    "**/yard-admin-audit.spec.ts",
    "**/yard-manager-audit.spec.ts",
    "**/gate-operator-audit.spec.ts",
    "**/yard-coordinator-audit.spec.ts",
    "**/dock-supervisor-audit.spec.ts",
  ],
  fullyParallel: true,
  workers: 5,
  retries: 0,
  timeout: 300_000,
  expect: { timeout: 15_000 },
  reporter: [
    ["list"],
    ["html", { outputFolder: "playwright-report-rbac", open: "never" }],
    ["json", { outputFile: "test-results/rbac-playwright-results.json" }],
  ],
  use: {
    baseURL: FRONTEND_URL,
    trace: "off",
    screenshot: "off",
    video: "off",
    actionTimeout: 10_000,
    navigationTimeout: 30_000,
    locale: "en-US",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  outputDir: "test-results/rbac-artifacts",
  globalTeardown: "./rbac-global-teardown.ts",
  metadata: {
    frontendUrl: FRONTEND_URL,
    apiUrl: API_URL,
    suite: "rbac-audit",
  },
});

export const RBAC_PATHS = {
  outDir: path.join(__dirname, "playwright-rbac-audit"),
  finalReport: path.join(__dirname, "playwright-rbac-audit", "final-rbac-audit.md"),
};

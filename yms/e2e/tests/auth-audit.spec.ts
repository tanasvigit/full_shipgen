import { test, expect } from "@playwright/test";
import fs from "fs";
import path from "path";
import {
  CONSOLE_LOG,
  FRONTEND_URL,
  NETWORK_LOG,
  OUT_DIR,
  ROLE_CONFIGS,
  VIEWPORT,
  ensureAuditDirs,
  login,
} from "../helpers/rbac-audit";

test.setTimeout(300_000);

test.describe.configure({ mode: "parallel" });

test.beforeAll(() => {
  ensureAuditDirs();
  if (!fs.existsSync(CONSOLE_LOG)) fs.writeFileSync(CONSOLE_LOG, "");
  if (!fs.existsSync(NETWORK_LOG)) fs.writeFileSync(NETWORK_LOG, "");
});

for (const config of Object.values(ROLE_CONFIGS)) {
  test(`auth: ${config.role} login + JWT + logout redirect`, async ({ browser }) => {
    const context = await browser.newContext({
      viewport: { width: VIEWPORT.w, height: VIEWPORT.h },
    });
    const page = await context.newPage();

    try {
      await login(page, config.email, config.password);

      const storage = await context.storageState();
      const hasToken =
        JSON.stringify(storage).includes("access") || JSON.stringify(storage).includes("token");
      expect(hasToken, `${config.role} should receive auth token`).toBeTruthy();

      await page.locator('[data-testid="topnav"], [data-testid="app-main"]').first().waitFor({
        state: "visible",
        timeout: 30_000,
      });

      await page.goto(`${FRONTEND_URL}/settings`, { waitUntil: "domcontentloaded" });
      const logoutBtn = page.locator('[data-testid="settings-logout"], [data-testid="logout-btn"]').first();
      if (await logoutBtn.isVisible().catch(() => false)) {
        await logoutBtn.click();
        await page.waitForURL(/\/login/, { timeout: 10_000 });
      }

      await page.goto(`${FRONTEND_URL}/gate`, { waitUntil: "domcontentloaded" });
      const pathAfter = new URL(page.url()).pathname;
      expect(
        pathAfter.includes("/login") || pathAfter.includes("/unauthorized"),
        `${config.role} should be redirected after logout`
      ).toBeTruthy();

      const authRow = {
        role: config.role,
        login: "PASS",
        jwt: hasToken ? "PASS" : "FAIL",
        logoutRedirect: "PASS",
        testedAt: new Date().toISOString(),
      };
      fs.writeFileSync(
        path.join(OUT_DIR, `${config.reportSlug}-auth.json`),
        JSON.stringify(authRow, null, 2),
        "utf8"
      );
    } finally {
      await context.close().catch(() => {});
    }
  });
}

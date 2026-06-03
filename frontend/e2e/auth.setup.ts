import { test as setup, expect } from "@playwright/test";
import fs from "fs";
import path from "path";
import { AUTH_STORAGE_PATH, loginViaApi } from "./helpers/auth";
import { waitForApiReady } from "./helpers/api";
import { requireCredentials } from "./helpers/env";

setup("authenticate admin and save storage state", async ({ page, request }) => {
  requireCredentials();
  await waitForApiReady(request);

  fs.mkdirSync(path.dirname(AUTH_STORAGE_PATH), { recursive: true });

  let ready = false;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    await loginViaApi(request, page);
    await page.goto("/", { waitUntil: "load" });
    const hasConsole = await page.getByTestId("console-layout").isVisible().catch(() => false);
    if (hasConsole) {
      ready = true;
      break;
    }
    await page.waitForTimeout(500);
  }

  if (!ready) {
    await page.goto("/", { waitUntil: "load" });
  }

  await expect(page).not.toHaveURL(/\/auth/);
  await expect(page.getByTestId("console-layout")).toBeVisible({ timeout: 45_000 });
  await expect(page.getByTestId("dashboard-page")).toBeVisible({ timeout: 45_000 });

  await page.context().storageState({ path: AUTH_STORAGE_PATH });
});

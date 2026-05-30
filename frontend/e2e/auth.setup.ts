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

  await loginViaApi(request, page);

  await page.waitForURL((url) => !url.pathname.startsWith("/auth"), { timeout: 45_000 });
  await expect(page.getByTestId("console-layout")).toBeVisible();
  await expect(page.getByTestId("dashboard-page")).toBeVisible();

  await page.context().storageState({ path: AUTH_STORAGE_PATH });
});

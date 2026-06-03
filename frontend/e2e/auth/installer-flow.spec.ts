import { test, expect } from "@playwright/test";
import { clearClientSession } from "../helpers/auth";
import { mockInstallerInitialize } from "../helpers/onboarding";

/** Keep shouldInstall=true until install steps finish (avoids Strict Mode / reload double-init). */
async function mockInstallerGateUntilComplete(
  page: import("@playwright/test").Page,
  { afterInstallShouldOnboard = true }: { afterInstallShouldOnboard?: boolean } = {},
) {
  let postInstall = false;
  await page.route("**/int/v1/installer/initialize", async (route) => {
    const payload = postInstall
      ? { shouldInstall: false, shouldOnboard: afterInstallShouldOnboard, defaultTheme: "dark" }
      : { shouldInstall: true, shouldOnboard: false, defaultTheme: "dark" };
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(payload),
    });
  });
  return {
    markInstallComplete: () => {
      postInstall = true;
    },
  };
}

test.describe("React installer flow", () => {
  test("full success flow runs steps and continues to onboarding", async ({ page }) => {
    const gate = await mockInstallerGateUntilComplete(page, { afterInstallShouldOnboard: true });
    await page.route("**/int/v1/installer/createdb", async (route) => {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ status: "success" }) });
    });
    await page.route("**/int/v1/installer/migrate", async (route) => {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ status: "success" }) });
    });
    await page.route("**/int/v1/installer/seed", async (route) => {
      gate.markInstallComplete();
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ status: "success" }) });
    });

    await page.goto("/install");
    await clearClientSession(page);
    await page.reload();
    await expect(page).toHaveURL(/\/install$/);
    await expect(page.getByTestId("installer-page")).toBeVisible();

    await page.getByTestId("installer-start").click();
    await expect(page.getByTestId("installer-step-createdb")).toContainText("completed");
    await expect(page.getByTestId("installer-step-migrate")).toContainText("completed");
    await expect(page.getByTestId("installer-step-seed")).toContainText("completed");
    await expect(page.getByTestId("installer-continue-onboard")).toBeEnabled();
    await page.getByTestId("installer-continue-onboard").click();
    await expect(page).toHaveURL(/\/auth\/onboard$/);
  });

  test("failure on migrate shows error and retry works", async ({ page }) => {
    await mockInstallerInitialize(page, { shouldInstall: true, shouldOnboard: false });
    await page.route("**/int/v1/installer/createdb", async (route) => {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ status: "success" }) });
    });
    let migrateCalls = 0;
    await page.route("**/int/v1/installer/migrate", async (route) => {
      migrateCalls += 1;
      if (migrateCalls === 1) {
        await route.fulfill({ status: 500, contentType: "application/json", body: JSON.stringify({ error: "Migrate failed" }) });
        return;
      }
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ status: "success" }) });
    });
    await page.route("**/int/v1/installer/seed", async (route) => {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ status: "success" }) });
    });

    await page.goto("/install");
    await expect(page.getByTestId("installer-page")).toBeVisible();
    await page.getByTestId("installer-start").click();
    await expect(page.getByTestId("installer-error")).toContainText("Migrate failed");
    await expect(page.getByTestId("installer-step-migrate")).toContainText("failed");
    await page.getByTestId("installer-start").click();
    await expect(page.getByTestId("installer-step-seed")).toContainText("completed");
    await expect.poll(() => migrateCalls).toBe(2);
  });

  test("installed state bypasses /install", async ({ page }) => {
    await mockInstallerInitialize(page, { shouldInstall: false, shouldOnboard: false });
    await page.goto("/install");
    await expect(page).toHaveURL(/\/auth$/);
    await expect(page.getByTestId("login-page")).toBeVisible();
  });

  test("after install, onboarding gate is honored", async ({ page }) => {
    const gate = await mockInstallerGateUntilComplete(page, { afterInstallShouldOnboard: true });
    await page.route("**/int/v1/installer/createdb", async (route) => {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ status: "success" }) });
    });
    await page.route("**/int/v1/installer/migrate", async (route) => {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ status: "success" }) });
    });
    await page.route("**/int/v1/installer/seed", async (route) => {
      gate.markInstallComplete();
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ status: "success" }) });
    });

    await page.goto("/install");
    await expect(page.getByTestId("installer-page")).toBeVisible();
    await page.getByTestId("installer-start").click();
    await expect(page.getByTestId("installer-continue-login")).toBeEnabled();
    await page.getByTestId("installer-continue-login").click();
    await expect(page).toHaveURL(/\/auth\/onboard$/);
  });
});

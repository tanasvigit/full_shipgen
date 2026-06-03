import { test, expect } from "@playwright/test";
import { clearClientSession } from "../helpers/auth";

function mockShouldOnboard(page: import("@playwright/test").Page, shouldOnboard: boolean) {
  return page.route("**/int/v1/onboard/should-onboard", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ should_onboard: shouldOnboard }),
    });
  });
}

async function fillBaseOnboardFields(page: import("@playwright/test").Page) {
  await page.getByTestId("onboard-name").fill("Prasanth Kumar");
  await page.getByTestId("onboard-email").fill("prasanth+persistence@techliv.net");
  await page.getByTestId("onboard-phone").fill("+919999999999");
  await page.getByTestId("onboard-organization-name").fill("Techliv Logistics");
}

async function startLoggedOutOnOnboard(page: import("@playwright/test").Page) {
  await page.goto("/auth");
  await clearClientSession(page);
  await page.reload();
  await page.goto("/auth/onboard");
  await expect(page.getByTestId("onboard-page")).toBeVisible();
}

test.describe("Auth onboarding context persistence", () => {
  test("restores non-sensitive fields after refresh", async ({ page }) => {
    await mockShouldOnboard(page, true);
    await startLoggedOutOnOnboard(page);
    await fillBaseOnboardFields(page);
    await page.reload();

    await expect(page.getByTestId("onboard-name")).toHaveValue("Prasanth Kumar");
    await expect(page.getByTestId("onboard-email")).toHaveValue("prasanth+persistence@techliv.net");
    await expect(page.getByTestId("onboard-phone")).toHaveValue("+919999999999");
    await expect(page.getByTestId("onboard-organization-name")).toHaveValue("Techliv Logistics");
  });

  test("does not restore password fields after refresh", async ({ page }) => {
    await mockShouldOnboard(page, true);
    await startLoggedOutOnOnboard(page);
    await fillBaseOnboardFields(page);
    await page.getByTestId("onboard-password").fill("Shipgen@E2e2026!");
    await page.getByTestId("onboard-password-confirmation").fill("Shipgen@E2e2026!");
    await page.reload();

    await expect(page.getByTestId("onboard-password")).toHaveValue("");
    await expect(page.getByTestId("onboard-password-confirmation")).toHaveValue("");
  });

  test("verify page survives refresh with restored session context", async ({ page }) => {
    await mockShouldOnboard(page, true);
    await page.route("**/int/v1/onboard/create-account", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          status: "success",
          session: "session-persist-verify",
          token: null,
          skipVerification: false,
        }),
      });
    });

    await startLoggedOutOnOnboard(page);
    await fillBaseOnboardFields(page);
    await page.getByTestId("onboard-password").fill("Shipgen@E2e2026!");
    await page.getByTestId("onboard-password-confirmation").fill("Shipgen@E2e2026!");
    await page.getByTestId("onboard-submit").click();

    await expect(page).toHaveURL(/\/auth\/onboard\/verify-email$/);
    await page.reload();
    await expect(page).toHaveURL(/\/auth\/onboard\/verify-email$/);
    await expect(page.getByTestId("onboard-verify-session")).toContainText("session-persist-verify");
  });

  test("successful verify clears persisted context", async ({ page }) => {
    await mockShouldOnboard(page, true);
    await page.route("**/int/v1/onboard/create-account", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          status: "success",
          session: "session-clear-on-success",
          token: null,
          skipVerification: false,
        }),
      });
    });
    await page.route("**/int/v1/onboard/verify-email", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          status: "ok",
          token: "verified-token-ctx-clear",
          verified_at: "2026-06-02T12:00:00Z",
        }),
      });
    });
    await page.route("**/int/v1/users/me", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          user: {
            id: "u-onboard-clear",
            uuid: "u-onboard-clear",
            name: "Prasanth Kumar",
            email: "prasanth+persistence@techliv.net",
            type: "admin",
            is_admin: true,
            permissions: ["fleet-ops *"],
          },
        }),
      });
    });
    await page.route("**/int/v1/auth/organizations", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          organizations: [{ id: "org-clear", uuid: "org-clear", name: "Techliv Logistics", role: "Administrator" }],
        }),
      });
    });

    await startLoggedOutOnOnboard(page);
    await fillBaseOnboardFields(page);
    await page.getByTestId("onboard-password").fill("Shipgen@E2e2026!");
    await page.getByTestId("onboard-password-confirmation").fill("Shipgen@E2e2026!");
    await page.getByTestId("onboard-submit").click();
    await expect(page).toHaveURL(/\/auth\/onboard\/verify-email$/);
    await page.getByTestId("onboard-verify-code").fill("123456");
    await page.getByTestId("onboard-verify-submit").click();
    await expect(page).toHaveURL("/");

    await clearClientSession(page);
    await page.goto("/auth/onboard");
    await expect(page.getByTestId("onboard-name")).toHaveValue("");
    await expect(page.getByTestId("onboard-email")).toHaveValue("");
    await expect(page.getByTestId("onboard-phone")).toHaveValue("");
    await expect(page.getByTestId("onboard-organization-name")).toHaveValue("");
  });
});


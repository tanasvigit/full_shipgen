import { test, expect } from "@playwright/test";
import { clearClientSession } from "../helpers/auth";
import { fillOnboardingForm, mockShouldOnboard } from "../helpers/onboarding";

test.describe("Auth onboarding create-account", () => {
  test("skipVerification=true authenticates and lands in console", async ({ page }) => {
    await mockShouldOnboard(page, true);

    let createAccountCalls = 0;
    await page.route("**/int/v1/onboard/create-account", async (route) => {
      createAccountCalls += 1;
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          status: "success",
          session: "session-abc",
          token: "mock-token-123",
          skipVerification: true,
        }),
      });
    });
    await page.route("**/int/v1/users/me", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          user: {
            id: "u-1",
            uuid: "u-1",
            name: "Prasanth Kumar",
            email: "prasanth+onboard@techliv.net",
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
          organizations: [{ id: "org-1", uuid: "org-1", name: "Techliv Logistics", role: "Administrator" }],
        }),
      });
    });

    await page.goto("/auth");
    await clearClientSession(page);
    await page.reload();
    await page.goto("/auth/onboard");
    await expect(page.getByTestId("onboard-page")).toBeVisible();

    await fillOnboardingForm(page, "onboard");
    await page.getByTestId("onboard-submit").click();

    await expect(page).toHaveURL("/", { timeout: 20_000 });
    await expect(page.getByTestId("dashboard-page")).toBeVisible();
    expect(createAccountCalls).toBe(1);
  });

  test("skipVerification=false routes to verify-email with session handoff", async ({ page }) => {
    await mockShouldOnboard(page, true);

    let createAccountCalls = 0;
    await page.route("**/int/v1/onboard/create-account", async (route) => {
      createAccountCalls += 1;
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          status: "success",
          session: "session-verify-xyz",
          token: null,
          skipVerification: false,
        }),
      });
    });

    await page.goto("/auth");
    await clearClientSession(page);
    await page.reload();
    await page.goto("/auth/onboard");
    await fillOnboardingForm(page, "onboard");
    await page.getByTestId("onboard-submit").click();

    await expect(page).toHaveURL(/\/auth\/onboard\/verify-email$/);
    await expect(page.getByTestId("onboard-verify-page")).toBeVisible();
    await expect(page.getByTestId("onboard-verify-session")).toContainText("session-verify-xyz");
    expect(createAccountCalls).toBe(1);
  });

  test("server validation error stays on form and surfaces message", async ({ page }) => {
    await mockShouldOnboard(page, true);
    await page.route("**/int/v1/onboard/create-account", async (route) => {
      await route.fulfill({
        status: 422,
        contentType: "application/json",
        body: JSON.stringify({
          error: "Validation failed",
          errors: ["An account with this email address already exists"],
        }),
      });
    });

    await page.goto("/auth");
    await clearClientSession(page);
    await page.reload();
    await page.goto("/auth/onboard");
    await fillOnboardingForm(page, "onboard");
    await page.getByTestId("onboard-submit").click();

    await expect(page).toHaveURL(/\/auth\/onboard$/);
    await expect(page.getByTestId("onboard-email-error")).toContainText("exists");
    await expect(page.getByTestId("onboard-page")).toBeVisible();
  });

  test("malformed create-account response recovers to safe auth path", async ({ page }) => {
    await mockShouldOnboard(page, true);
    await page.route("**/int/v1/onboard/create-account", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          status: "success",
          session: null,
          token: null,
        }),
      });
    });

    await page.goto("/auth");
    await clearClientSession(page);
    await page.reload();
    await page.goto("/auth/onboard");
    await fillOnboardingForm(page, "malformed");
    await page.getByTestId("onboard-submit").click();

    await expect(page).toHaveURL(/\/auth\/onboard$/);
    await expect(page.getByTestId("onboard-page")).toBeVisible();
  });

  test("bootstrap failure after create-account token recovers safely", async ({ page }) => {
    await mockShouldOnboard(page, true);
    await page.route("**/int/v1/onboard/create-account", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          status: "success",
          session: "session-bootstrap-fail",
          token: "token-bootstrap-fail",
          skipVerification: true,
        }),
      });
    });
    await page.route("**/int/v1/users/me", async (route) => {
      await route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({ error: "bootstrap failed" }),
      });
    });

    await page.goto("/auth");
    await clearClientSession(page);
    await page.reload();
    await page.goto("/auth/onboard");
    await fillOnboardingForm(page, "bootstrap-fail");
    await page.getByTestId("onboard-submit").click();

    await expect(page).toHaveURL(/\/auth\/onboard$/);
    await expect(page.getByTestId("onboard-page")).toBeVisible();
  });
});

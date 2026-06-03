import { test, expect } from "@playwright/test";
import { clearClientSession } from "../helpers/auth";
import { fillOnboardingForm, mockShouldOnboard } from "../helpers/onboarding";

async function landOnVerifyPage(page: import("@playwright/test").Page, session = "session-verify-xyz") {
  await mockShouldOnboard(page, true);
  await page.route("**/int/v1/onboard/create-account", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        status: "success",
        session,
        token: null,
        skipVerification: false,
      }),
    });
  });
  await page.goto("/auth");
  await clearClientSession(page);
  await page.reload();
  await page.goto("/auth/onboard");
  await fillOnboardingForm(page, "verify");
  await page.getByTestId("onboard-submit").click();
  await expect(page).toHaveURL(/\/auth\/onboard\/verify-email$/);
  await expect(page.getByTestId("onboard-verify-page")).toBeVisible();
}

test.describe("Auth onboarding verify-email", () => {
  test("successful verify authenticates and routes to console", async ({ page }) => {
    await landOnVerifyPage(page, "session-success");
    await page.route("**/int/v1/onboard/verify-email", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          status: "ok",
          token: "verify-token-123",
          verified_at: "2026-06-02T10:00:00Z",
        }),
      });
    });
    await page.route("**/int/v1/users/me", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          user: {
            id: "u-verify",
            uuid: "u-verify",
            name: "Prasanth Kumar",
            email: "prasanth+verify@techliv.net",
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
          organizations: [{ id: "org-verify", uuid: "org-verify", name: "Techliv Logistics", role: "Administrator" }],
        }),
      });
    });

    await page.getByTestId("onboard-verify-code").fill("123456");
    await page.getByTestId("onboard-verify-submit").click();
    await expect(page).toHaveURL("/", { timeout: 20_000 });
    await expect(page.getByTestId("dashboard-page")).toBeVisible();
  });

  test("invalid verify code stays on page and shows error", async ({ page }) => {
    await landOnVerifyPage(page, "session-invalid-code");
    await page.route("**/int/v1/onboard/verify-email", async (route) => {
      await route.fulfill({
        status: 400,
        contentType: "application/json",
        body: JSON.stringify({
          error: "Invalid verification code.",
        }),
      });
    });

    await page.getByTestId("onboard-verify-code").fill("000000");
    await page.getByTestId("onboard-verify-submit").click();
    await expect(page).toHaveURL(/\/auth\/onboard\/verify-email$/);
    await expect(page.getByTestId("onboard-verify-error")).toContainText("Invalid verification code");
  });

  test("resend email success and error states", async ({ page }) => {
    await landOnVerifyPage(page, "session-resend-email");
    let emailCalls = 0;
    await page.route("**/int/v1/onboard/send-verification-email", async (route) => {
      emailCalls += 1;
      if (emailCalls === 1) {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ status: "ok" }),
        });
        return;
      }
      await route.fulfill({
        status: 400,
        contentType: "application/json",
        body: JSON.stringify({ error: "Email resend failed." }),
      });
    });

    await page.getByTestId("onboard-resend-email").click();
    await expect(page.getByTestId("onboard-resend-email")).toBeVisible();
    await page.getByTestId("onboard-resend-email").click();
    await expect(page.getByTestId("onboard-verify-error")).toContainText("Email resend failed.");
  });

  test("resend sms success and error states", async ({ page }) => {
    await landOnVerifyPage(page, "session-resend-sms");
    let smsCalls = 0;
    await page.route("**/int/v1/onboard/send-verification-sms", async (route) => {
      smsCalls += 1;
      if (smsCalls === 1) {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ status: "ok" }),
        });
        return;
      }
      await route.fulfill({
        status: 400,
        contentType: "application/json",
        body: JSON.stringify({ error: "SMS resend failed." }),
      });
    });

    await page.getByTestId("onboard-resend-sms").click();
    await expect(page.getByTestId("onboard-resend-sms")).toBeVisible();
    await page.getByTestId("onboard-resend-sms").click();
    await expect(page.getByTestId("onboard-verify-error")).toContainText("SMS resend failed.");
  });

  test("missing onboarding session redirects safely to onboard", async ({ page }) => {
    await mockShouldOnboard(page, true);
    await page.goto("/auth");
    await clearClientSession(page);
    await page.reload();
    await page.goto("/auth/onboard/verify-email");
    await expect(page.getByTestId("onboard-verify-missing-session")).toBeVisible();
    await expect(page).toHaveURL(/\/auth\/onboard$/, { timeout: 5_000 });
  });

  test("malformed verify response recovers to safe auth path", async ({ page }) => {
    await landOnVerifyPage(page, "session-malformed-verify");
    await page.route("**/int/v1/onboard/verify-email", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          status: "ok",
          // missing token
        }),
      });
    });

    await page.getByTestId("onboard-verify-code").fill("654321");
    await page.getByTestId("onboard-verify-submit").click();
    await expect(page).toHaveURL(/\/auth\/onboard$/);
    await expect(page.getByTestId("onboard-page")).toBeVisible();
  });

  test("resend buttons enforce state and retry helper is available", async ({ page }) => {
    await landOnVerifyPage(page, "session-retry-state");
    let emailCalls = 0;
    await page.route("**/int/v1/onboard/send-verification-email", async (route) => {
      emailCalls += 1;
      await route.fulfill({
        status: 400,
        contentType: "application/json",
        body: JSON.stringify({ error: "Email resend failed." }),
      });
    });

    await expect(page.getByTestId("onboard-resend-email")).toBeEnabled();
    await page.getByTestId("onboard-resend-email").click();
    await expect(page.getByTestId("onboard-verify-error")).toContainText("Email resend failed.");
    await expect(page.getByTestId("onboard-verify-retry")).toBeVisible();
    await page.getByTestId("onboard-verify-retry").click();
    await expect.poll(() => emailCalls).toBe(2);
  });
});

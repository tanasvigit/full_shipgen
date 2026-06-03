import { test, expect } from "@playwright/test";
import { clearClientSession } from "../helpers/auth";
import { mockShouldOnboard } from "../helpers/onboarding";

test.describe("Auth onboarding startup gate", () => {
  test("should_onboard=true routes logged-out users to /auth/onboard", async ({ page }) => {
    await mockShouldOnboard(page, true);
    await page.goto("/auth");
    await clearClientSession(page);
    await page.reload();

    await page.goto("/");
    await expect(page).toHaveURL(/\/auth\/onboard$/);
    await expect(page.getByTestId("onboard-page")).toBeVisible();

    await page.goto("/auth");
    await expect(page).toHaveURL(/\/auth\/onboard$/);

    // CTA contract on login page still points to onboarding.
    await page.unroute("**/int/v1/onboard/should-onboard");
    await mockShouldOnboard(page, false);
    await page.goto("/auth");
    await expect(page.getByTestId("login-page")).toBeVisible();
    await expect(page.getByTestId("login-create-account-link")).toHaveAttribute("href", "/auth/onboard");
  });

  test("should_onboard=false keeps normal logged-out auth flow", async ({ page }) => {
    await mockShouldOnboard(page, false);
    await page.goto("/auth");
    await clearClientSession(page);
    await page.reload();

    await page.goto("/");
    await expect(page).toHaveURL(/\/auth$/);
    await expect(page.getByTestId("login-page")).toBeVisible();

    await page.goto("/auth");
    await expect(page).toHaveURL(/\/auth$/);
  });

  for (const shouldOnboard of [true, false]) {
    test(`/onboarding stays protected when should_onboard=${shouldOnboard}`, async ({ page }) => {
      await mockShouldOnboard(page, shouldOnboard);
      await page.goto("/auth");
      await clearClientSession(page);
      await page.reload();

      await page.goto("/onboarding");
      const expected = shouldOnboard ? /\/auth\/onboard$/ : /\/auth$/;
      await expect(page).toHaveURL(expected);
      await expect(page.getByTestId(shouldOnboard ? "onboard-page" : "login-page")).toBeVisible();
    });
  }
});

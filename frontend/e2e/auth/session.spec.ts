import { test, expect } from "../fixtures/test";
import { logoutViaUI, clearClientSession, loginViaUI } from "../helpers/auth";
import { mockShouldOnboard } from "../helpers/onboarding";
import { sel } from "../helpers/selectors";

test.describe("Session", () => {
  test.beforeEach(async ({ page }) => {
    await mockShouldOnboard(page, false);
  });
  test("logout returns to login", async ({ page }) => {
    await loginViaUI(page);
    await logoutViaUI(page);
    await expect(page.locator(sel.loginPage)).toBeVisible();
  });

  test("cleared storage redirects on next navigation", async ({ page }) => {
    await loginViaUI(page);
    await clearClientSession(page);
    await page.goto("/fleet-ops/operations/orders");
    await expect(page).toHaveURL(/\/auth/);
  });
});

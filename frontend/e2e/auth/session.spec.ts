import { test, expect } from "../fixtures/test";
import { logoutViaUI, clearClientSession } from "../helpers/auth";
import { sel } from "../helpers/selectors";
import { gotoRoute } from "../helpers/navigation";

test.describe("Session", () => {
  test("logout returns to login", async ({ page }) => {
    await gotoRoute(page, "/");
    await logoutViaUI(page);
    await expect(page.locator(sel.loginPage)).toBeVisible();
  });

  test("cleared storage redirects on next navigation", async ({ page }) => {
    await gotoRoute(page, "/");
    await clearClientSession(page);
    await page.goto("/fleet-ops/operations/orders");
    await expect(page).toHaveURL(/\/auth/);
  });
});

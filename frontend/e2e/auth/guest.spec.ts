import { test, expect } from "@playwright/test";
import { clearClientSession } from "../helpers/auth";
import { sel } from "../helpers/selectors";

test.describe("Route protection", () => {
  test("unauthenticated user is redirected to login", async ({ page }) => {
    await page.goto("/");
    await clearClientSession(page);
    await page.reload();
    await expect(page).toHaveURL(/\/auth/);
    await expect(page.locator(sel.loginPage)).toBeVisible();
  });

  test("protected deep link redirects to auth", async ({ page }) => {
    await page.goto("/fleet-ops/operations/orders");
    await clearClientSession(page);
    await page.reload();
    await expect(page).toHaveURL(/\/auth/);
  });
});

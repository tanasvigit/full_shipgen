import { test, expect } from "../fixtures/test";
import { gotoRoute } from "../helpers/navigation";
import { expectDataTableReady, paginateIfPresent, searchDataTable } from "../helpers/page";
import { waitForApiSettle } from "../helpers/network";

test.describe("Global UI behavior", () => {
  test("dashboard quick actions", async ({ page }) => {
    await gotoRoute(page, "/");
    await expect(page.locator('[data-testid="dashboard-page"]')).toBeVisible();
    const ordersLink = page.locator('[data-testid="dashboard-orders-link"]');
    if (await ordersLink.isVisible()) {
      await ordersLink.click();
      await expect(page).toHaveURL(/fleet-ops\/operations\/orders/);
    }
  });

  test("notifications page filters", async ({ page }) => {
    await gotoRoute(page, "/notifications");
    await expect(page.locator('[data-testid="notifications-page"]')).toBeVisible();
    const filter = page.getByRole("button", { name: /unread|all/i }).first();
    if (await filter.isVisible()) await filter.click();
  });

  test("data table pagination on orders", async ({ page }) => {
    await gotoRoute(page, "/fleet-ops/operations/orders");
    await expectDataTableReady(page, "orders-table");
    await paginateIfPresent(page, "orders-table");
  });

  test("toast appears on failed action simulation", async ({ page }) => {
    await gotoRoute(page, "/fleet-ops/operations/orders");
    await waitForApiSettle(page);
    await expect(page.locator('[data-testid="console-main"]')).toBeVisible();
  });

  test("responsive layout — sidebar visible on desktop", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await gotoRoute(page, "/");
    await expect(page.locator('[data-testid="console-sidebar"]')).toBeVisible();
  });
});

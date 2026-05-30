import { test, expect } from "../../../e2e/fixtures/fleetops-stabilization";
import { gotoRoute } from "../../../e2e/helpers/navigation";
import { waitForApiSettle } from "../../../e2e/helpers/network";

test.describe("FleetOps Phase 2 — Routes", () => {
  test("route planner page loads with wizard", async ({ page }) => {
    await gotoRoute(page, "/fleet-ops/operations/routes/new", { pageTestId: "route-new-page" });
    await expect(page.getByTestId("route-optimization-wizard")).toBeVisible({ timeout: 45_000 });
  });

  test("plan route from orders selection navigates with order_ids", async ({ page }) => {
    await gotoRoute(page, "/fleet-ops/operations/orders", { pageTestId: "orders-list-page" });
    const checkbox = page.locator('[data-testid^="orders-table-select-"]').first();
    if (!(await checkbox.isVisible())) {
      test.skip();
      return;
    }
    await checkbox.check();
    await page.getByTestId("orders-plan-routes").click();
    await expect(page).toHaveURL(/\/fleet-ops\/operations\/routes\/new\?order_ids=/);
    await expect(page.getByTestId("route-optimization-wizard")).toBeVisible();
  });

  test("routes list page loads", async ({ page }) => {
    await gotoRoute(page, "/fleet-ops/operations/routes", { pageTestId: "routes-list-page" });
    await expect(page.getByTestId("routes-table")).toBeVisible();
  });

  test("route detail map shell when route exists", async ({ page }) => {
    await gotoRoute(page, "/fleet-ops/operations/routes", { pageTestId: "routes-list-page" });
    const link = page.locator('[data-testid="routes-table"] a').first();
    if (!(await link.isVisible())) {
      test.skip();
      return;
    }
    await link.click();
    await expect(page.getByTestId("route-detail-page")).toBeVisible({ timeout: 30_000 });
    await expect(page.getByTestId("route-detail-map")).toBeVisible();
  });
});

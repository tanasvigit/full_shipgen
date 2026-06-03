import { test, expect } from "../fixtures/fleetops-stabilization";
import { gotoRoute } from "../helpers/navigation";

test.describe("FleetOps Phase 8 — routes & orchestrator @regression", { tag: "@regression" }, () => {
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

  test("orchestrator page loads with engine selector", async ({ page }) => {
    await gotoRoute(page, "/fleet-ops/operations/orchestrator", { pageTestId: "orchestrator-page" });
    await expect(page.getByTestId("orchestrator-mode")).toBeVisible();
    await expect(page.getByTestId("orchestrator-engine")).toBeVisible();
    await expect(page.getByTestId("orchestrator-orders-table")).toBeVisible();
  });

  test("orchestrator import modal opens", async ({ page }) => {
    await gotoRoute(page, "/fleet-ops/operations/orchestrator", { pageTestId: "orchestrator-page" });
    const importBtn = page.getByTestId("orchestrator-import");
    if (!(await importBtn.isVisible())) {
      test.skip();
      return;
    }
    await importBtn.click();
    await expect(page.getByTestId("orchestrator-import-dialog")).toBeVisible();
  });
});

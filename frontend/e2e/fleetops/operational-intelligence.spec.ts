import { test, expect } from "../fixtures/test";
import { gotoRoute } from "../helpers/navigation";
import { waitForApiSettle } from "../helpers/network";

test.describe("FleetOps — operational intelligence", () => {
  test("orders list shows metrics strip and suggestions panel", async ({ page }) => {
    await gotoRoute(page, "/fleet-ops/operations/orders", { pageTestId: "orders-list-page" });
    await waitForApiSettle(page);
    await page.getByTestId("orders-view-table").click();

    await expect(page.getByTestId("ops-metrics-strip")).toBeVisible({ timeout: 60_000 });
    await expect(page.getByTestId("dispatcher-suggestions")).toBeVisible({ timeout: 15_000 });
  });

  test("dashboard command center shows operational metrics", async ({ page }) => {
    await gotoRoute(page, "/", { pageTestId: "dashboard-page" });
    await waitForApiSettle(page);

    await expect(page.getByTestId("dashboard-page")).toBeVisible({ timeout: 45_000 });
    await expect(page.getByTestId("dashboard-ops-metrics")).toBeVisible({ timeout: 60_000 });
    await expect(page.getByTestId("dashboard-ops-metrics-active")).toBeVisible();
  });
});

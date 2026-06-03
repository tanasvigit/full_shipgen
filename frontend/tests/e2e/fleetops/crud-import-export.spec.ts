import { test, expect } from "../../../e2e/fixtures/fleetops-stabilization";
import { waitForApiSettle } from "../../../e2e/helpers/network";

test.describe("FleetOps Phase 4 — CRUD import/export", () => {
  test("vendor list shows import/export bar", async ({ page }) => {
    await page.goto("/fleet-ops/management/vendors");
    if (await page.getByTestId("vendor-forbidden").isVisible().catch(() => false)) {
      test.skip();
      return;
    }
    await expect(page.getByTestId("vendor-import-export-bar")).toBeVisible();
    await expect(page.getByTestId("vendor-export")).toBeVisible();
    await expect(page.getByTestId("vendor-import")).toBeVisible();
  });

  test("work orders list import/export bar", async ({ page }) => {
    await page.goto("/fleet-ops/maintenance/work-orders");
    const list = page.getByTestId("work-order-list-page");
    const forbidden = page.getByTestId("work-order-forbidden");
    await expect(list.or(forbidden)).toBeVisible();
    if (await forbidden.isVisible()) {
      test.skip();
      return;
    }
    await expect(page.getByTestId("work-order-import-export-bar")).toBeVisible();
  });
});

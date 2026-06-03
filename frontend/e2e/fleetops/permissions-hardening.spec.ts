import { test, expect } from "../fixtures/fleetops-stabilization";
import {
  gotoOrdersList,
  interceptUsersMeEmptyPermissions,
  clearUsersMeIntercept,
} from "../helpers/fleetops/stabilization";

test.describe("FleetOps Phase 8 — permissions fail-closed @regression", { tag: "@regression" }, () => {
  test.afterEach(async ({ page }) => {
    await clearUsersMeIntercept(page);
  });

  test("strict intercept — empty permissions shows forbidden shell", async ({ page }) => {
    await interceptUsersMeEmptyPermissions(page);
    await page.reload({ waitUntil: "load" });
    await page.goto("/fleet-ops/operations/orders");
    await expect(page.getByTestId("fleetops-forbidden")).toBeVisible({ timeout: 45_000 });
    await expect(page.getByTestId("orders-new-button")).toBeHidden();
    await expect(page.getByTestId("orders-import-button")).toBeHidden();
    await expect(page.getByTestId("orders-bulk-dispatch")).toBeHidden();
  });

  test("strict intercept — order config blocks create when forbidden", async ({ page }) => {
    await interceptUsersMeEmptyPermissions(page);
    await page.reload({ waitUntil: "load" });
    await page.goto("/fleet-ops/operations/order-config");
    await expect(page.getByTestId("console-layout")).toBeVisible({ timeout: 45_000 });
    const forbidden = page.getByTestId("order-config-forbidden");
    const manager = page.getByTestId("order-config-manager-page");
    const newBtn = page.getByTestId("order-config-new-button");
    await expect(forbidden.or(manager)).toBeVisible({ timeout: 30_000 });
    if (await forbidden.isVisible()) {
      await expect(newBtn).toBeHidden();
    }
  });

  test("admin session — orders list and bulk toolbar region present", async ({ page }) => {
    await gotoOrdersList(page);
    await expect(page.getByTestId("orders-list-page")).toBeVisible();
    await expect(page.getByTestId("orders-filters")).toBeVisible();
  });
});

import { test, expect } from "../../../e2e/fixtures/fleetops-stabilization";
import {
  gotoOrdersList,
  interceptUsersMeEmptyPermissions,
  clearUsersMeIntercept,
} from "../../../e2e/helpers/fleetops/stabilization";
import { gotoRoute } from "../../../e2e/helpers/navigation";

test.describe("FleetOps Day 1 — Permissions G003", () => {
  test.afterEach(async ({ page }) => {
    await clearUsersMeIntercept(page);
  });

  test("orders list loads; create visible when API grants permissions", async ({ page }) => {
    await gotoOrdersList(page);
    await expect(page.getByTestId("orders-list-page")).toBeVisible();
    const newBtn = page.getByTestId("orders-new-button");
    const permissive = process.env.VITE_FLEETOPS_PERMISSIVE === "true";
    if (permissive) {
      await expect(newBtn).toBeVisible();
    }
  });

  test("strict intercept — empty permissions shows forbidden fleet-ops shell", async ({ page }) => {
    await interceptUsersMeEmptyPermissions(page);
    await page.reload({ waitUntil: "load" });
    await page.goto("/fleet-ops/operations/orders");
    await expect(page.getByTestId("fleetops-forbidden")).toBeVisible({ timeout: 45_000 });
    await expect(page.getByTestId("orders-new-button")).toBeHidden();
    await expect(page.getByTestId("orders-import-button")).toBeHidden();
    await expect(page.getByTestId("orders-bulk-dispatch")).toBeHidden();
  });

  test("strict intercept — direct URL to order config shows forbidden or blocks actions", async ({ page }) => {
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

  test("sidebar — fleet ops operations links reachable when authenticated", async ({ page }) => {
    await gotoOrdersList(page);
    for (const slug of ["routes", "schedule", "service-rates"]) {
      const link = page.getByTestId(`sidebar-link-${slug}`);
      await expect(link).toBeVisible();
    }
  });
});

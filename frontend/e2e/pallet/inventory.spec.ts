import { test, expect } from "../fixtures/test";
import { gotoRoute, gotoPageRoot, expectPageRoot } from "../helpers/navigation";
import { expectDataTableReady } from "../helpers/page";

test.describe("Pallet", () => {
  test("pallet home", async ({ page }) => {
    await gotoRoute(page, "/pallet", { pageTestId: "pallet-home" });
    await expectPageRoot(page, "pallet-home");
  });

  test("inventory list", async ({ page }) => {
    await gotoPageRoot(page, "/pallet/inventory", "inventory-list-page");
    await expect(page.getByText(/Loading|No records|inventory-table/).first()).toBeVisible({ timeout: 30_000 });
    const table = page.locator('[data-testid="inventory-table"]');
    if (await table.isVisible()) {
      await expectDataTableReady(page, "inventory-table");
    }
  });

  test("warehouses", async ({ page }) => {
    await gotoPageRoot(page, "/pallet/warehouses", "warehouses-list-page");
    await expect(
      page
        .locator('[data-testid^="warehouse-card-"]')
        .or(page.getByText(/No warehouses found|Loading warehouses/i))
        .first(),
    ).toBeVisible({ timeout: 30_000 });
  });

  test("transfers list", async ({ page }) => {
    await gotoPageRoot(page, "/pallet/transfers", "transfers-list-page");
    await expect(
      page.locator('[data-testid="transfers-table"]').or(page.getByText(/No inter-warehouse audit events|Loading transfer/i)),
    ).toBeVisible({ timeout: 20_000 });
  });

  test("suppliers", async ({ page }) => {
    await gotoPageRoot(page, "/pallet/suppliers", "suppliers-list-page");
    await expect(
      page
        .locator('[data-testid^="supplier-card-"]')
        .or(page.getByText(/No suppliers found|Loading suppliers/i))
        .first(),
    ).toBeVisible({ timeout: 30_000 });
  });

  test("purchase orders", async ({ page }) => {
    await gotoPageRoot(page, "/pallet/purchase-orders", "purchase-orders-list-page");
    await expect(
      page.locator('[data-testid="po-table"]').or(page.getByText(/Loading purchase orders|No records/i)).first(),
    ).toBeVisible({ timeout: 30_000 });
  });
});

import { test, expect } from "../fixtures/test";
import { gotoRoute, gotoPageRoot, expectPageRoot } from "../helpers/navigation";
import { expectDataTableReady, expectListSurface, searchDataTable } from "../helpers/page";

test.describe("Storefront", () => {
  test("overview and product workflows", async ({ page }) => {
    await gotoRoute(page, "/storefront");
    await expectPageRoot(page, "storefront-home");
    await page.locator('[data-testid="storefront-new-product"]').click();
    await expectPageRoot(page, "product-new-page");
    await page.goBack();
  });

  test("products list search", async ({ page }) => {
    await gotoRoute(page, "/storefront/products");
    await expectPageRoot(page, "products-list-page");
    await page.locator('[data-testid="products-view-table"]').click();
    await expectDataTableReady(page, "products-table");
    await searchDataTable(page, " ", "products-table");
  });

  test("customers and catalogs", async ({ page }) => {
    await gotoRoute(page, "/storefront/customers");
    await expectListSurface(page, { tableTestId: "customers-table", emptyTestIds: ["customers-empty"] });
    await gotoRoute(page, "/storefront/catalogs");
    await expectPageRoot(page, "catalogs-list-page");
    await expectListSurface(page, {
      cardSelector: '[data-testid^="catalog-card-"]',
      emptyTestIds: ["catalogs-empty"],
    });
  });

  test("promotions, coupons, networks", async ({ page }) => {
    await gotoRoute(page, "/storefront/promotions");
    await expectPageRoot(page, "promotions-page");
    await gotoRoute(page, "/storefront/coupons");
    await expectPageRoot(page, "coupons-list-page");
    await gotoRoute(page, "/storefront/networks");
    await expectPageRoot(page, "networks-list-page");
  });

  test("checkout preview form", async ({ page }) => {
    await gotoPageRoot(page, "/storefront/checkout", "checkout-preview-page");
    await expect(page.locator('[data-testid="checkout-next"]')).toBeVisible();
  });
});

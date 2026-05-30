import { test, expect } from "../../../e2e/fixtures/fleetops-stabilization";
import {
  gotoOrdersList,
  searchOrdersClientTable,
} from "../../../e2e/helpers/fleetops/stabilization";

test.describe("FleetOps — Orders module search bar", () => {
  test.beforeEach(async ({ page }) => {
    await gotoOrdersList(page);
  });

  test("search bar is visible on the orders table toolbar", async ({ page }) => {
    await expect(page.getByTestId("orders-table-search-wrap")).toBeVisible();
    const search = page.getByTestId("orders-table-search");
    await expect(search).toBeVisible();
    await expect(search).toHaveAttribute("placeholder", "Search…");
    await expect(search).toBeEnabled();
    await expect(search).toHaveValue("");
  });

  test("typing filters the table instantly (same as drivers/vehicles)", async ({ page }) => {
    await searchOrdersClientTable(page, "order");
  });

  test("search does not change the URL (client-side filter only)", async ({ page }) => {
    const search = page.getByTestId("orders-table-search");
    const urlBefore = page.url();
    await search.fill("fleet");
    await expect(search).toHaveValue("fleet");
    expect(page.url()).toBe(urlBefore);
    await search.fill("");
  });
});

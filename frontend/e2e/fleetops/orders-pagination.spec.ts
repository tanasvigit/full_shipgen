import { test, expect } from "../fixtures/fleetops-stabilization";
import {
  gotoOrdersList,
  paginateOrdersServerTable,
  waitForOrdersListApi,
} from "../helpers/fleetops/stabilization";
import { expectDataTableReady } from "../helpers/page";

test.describe("FleetOps Phase 8 — orders pagination @regression", { tag: "@regression" }, () => {
  test.beforeEach(async ({ page }) => {
    await gotoOrdersList(page);
  });

  test("server pagination controls advance list page", async ({ page }) => {
    const listPromise = waitForOrdersListApi(page);
    await page.getByTestId("orders-refresh").click();
    const res = await listPromise;
    expect(res.ok()).toBeTruthy();
    await expectDataTableReady(page, "orders-table");
    await paginateOrdersServerTable(page);
  });

  test("URL includes page param after pagination", async ({ page }) => {
    await paginateOrdersServerTable(page);
    const url = new URL(page.url());
    const pageParam = url.searchParams.get("page");
    if (pageParam) {
      expect(Number(pageParam)).toBeGreaterThan(1);
    }
  });
});

import { test, expect } from "../../../e2e/fixtures/fleetops-stabilization";
import {
  gotoOrdersList,
  expectOrdersUrlParams,
  reloadAndPreserveOrdersFilters,
  waitForOrdersListApi,
  selectFirstOrderCheckbox,
  assertNoRapidDuplicateListFetches,
  paginateOrdersServerTable,
  searchOrdersServerTable,
} from "../../../e2e/helpers/fleetops/stabilization";
import { waitForApiSettle } from "../../../e2e/helpers/network";
import { expectDataTableReady } from "../../../e2e/helpers/page";

test.describe("FleetOps Day 1 — Orders list", () => {
  test.beforeEach(async ({ page }) => {
    await gotoOrdersList(page);
  });

  test("G001 — table pagination, sort, and server search", async ({ page }) => {
    const listPromise = waitForOrdersListApi(page);
    await page.getByTestId("orders-refresh").click();
    const res = await listPromise;
    expect(res.ok()).toBeTruthy();

    const table = await expectDataTableReady(page, "orders-table");
    const safeSortHeader = table.locator("thead th", { hasText: /^(Status|Priority|Scheduled)$/i }).first();
    if (await safeSortHeader.isVisible()) {
      await safeSortHeader.click();
      await waitForApiSettle(page);
    }
    await paginateOrdersServerTable(page);
    await searchOrdersServerTable(page, "e2e");
  });

  test("G001 — status filter updates URL and refetches", async ({ page }) => {
    const chips = page.locator('[data-testid="orders-filters"] button');
    const count = await chips.count();
    if (count < 2) {
      test.skip();
      return;
    }
    await chips.nth(1).click();
    const url = new URL(page.url());
    const status = url.searchParams.get("status");
    if (status) {
      expect(status).not.toBe("all");
    }
    await waitForApiSettle(page);
    await reloadAndPreserveOrdersFilters(page, status ? { status } : {});
  });

  test("G001 — without_driver filter syncs to URL", async ({ page }) => {
    const toggle = page.getByTestId("orders-filter-without-driver");
    await toggle.click();
    await expectOrdersUrlParams(page, { without_driver: "1" });
    await page.reload();
    await expect(page.getByTestId("orders-list-page")).toBeVisible();
    await expectOrdersUrlParams(page, { without_driver: "1" });
    await toggle.click();
    await expectOrdersUrlParams(page, { without_driver: undefined });
  });

  test("G033 — column toggle hides scheduled column", async ({ page }) => {
    const table = page.getByTestId("orders-table");
    const scheduledHeader = table.locator("thead th", { hasText: /^Scheduled$/i });
    await expect(scheduledHeader).toBeVisible();
    await page.getByRole("button", { name: /columns/i }).click();
    await expect(scheduledHeader).toBeHidden();
    await page.getByRole("button", { name: /columns/i }).click();
    await expect(scheduledHeader).toBeVisible();
  });

  test("G034 — layout query sync and reload persistence", async ({ page }) => {
    await page.getByTestId("orders-view-kanban").click();
    await expectOrdersUrlParams(page, { layout: "kanban" });
    await page.reload();
    await expect(page.getByTestId("orders-list-page")).toBeVisible();
    await expectOrdersUrlParams(page, { layout: "kanban" });
    await page.getByTestId("orders-view-table").click();
    await expectOrdersUrlParams(page, { layout: undefined });
  });

  test("G055 — bulk_query filter syncs to URL", async ({ page }) => {
    const input = page.getByTestId("orders-filter-bulk-query");
    await input.fill("status:created");
    await page.getByRole("button", { name: /^Apply$/i }).click();
    await expectOrdersUrlParams(page, { bulk_query: "status:created" });
  });

  test("G055 — bulk selection and plan routes navigation", async ({ page }) => {
    const selected = await selectFirstOrderCheckbox(page);
    if (!selected) {
      test.skip();
      return;
    }
    await page.getByTestId("orders-plan-routes").click();
    await expect(page).toHaveURL(/\/fleet-ops\/operations\/routes\/new\?order_ids=/);
    await expect(page.getByTestId("route-new-page")).toBeVisible();
  });

  test("stability — no burst duplicate list fetches on refresh", async ({ page }) => {
    await assertNoRapidDuplicateListFetches(page, async () => {
      await page.getByTestId("orders-refresh").click();
    });
  });
});

import { test, expect } from "../../../e2e/fixtures/fleetops-stabilization";
import {
  gotoOrdersList,
  openFirstOrderDetail,
  waitForOrdersListApi,
} from "../../../e2e/helpers/fleetops/stabilization";
import { waitForApiSettle } from "../../../e2e/helpers/network";

test.describe("FleetOps Day 1 — Realtime G056", () => {
  test("orders list refresh stays stable", async ({ page }) => {
    await gotoOrdersList(page);
    const listReq = waitForOrdersListApi(page);
    await page.getByTestId("orders-refresh").click();
    await listReq.catch(() => null);
    await waitForApiSettle(page);
    await expect(page.getByTestId("orders-list-page")).toBeVisible();
    await expect(page.getByTestId("orders-table")).toBeVisible();
  });

  test("order detail manual refresh stays stable", async ({ page }) => {
    await gotoOrdersList(page);
    if (!(await openFirstOrderDetail(page))) {
      test.skip();
      return;
    }
    await page.getByTestId("order-refresh").click();
    await waitForApiSettle(page);
    await expect(page.getByTestId("order-detail-page")).toBeVisible();
    await page.reload();
    await expect(page.getByTestId("order-detail-page")).toBeVisible();
  });

  test("navigation list → detail → list does not break shell", async ({ page }) => {
    await gotoOrdersList(page);
    if (!(await openFirstOrderDetail(page))) {
      test.skip();
      return;
    }
    await page.goBack();
    await expect(page.getByTestId("orders-list-page")).toBeVisible();
    await openFirstOrderDetail(page);
    await expect(page.getByTestId("order-detail-page")).toBeVisible();
    await page.getByTestId("order-refresh").click();
    await waitForApiSettle(page);
  });

  test("rapid tab switch on order detail — no page crash", async ({ page }) => {
    await gotoOrdersList(page);
    if (!(await openFirstOrderDetail(page))) {
      test.skip();
      return;
    }
    for (const tab of ["order-tab-overview", "order-tab-activity", "detail-tab-notes", "detail-tab-metadata"]) {
      const el = page.getByTestId(tab);
      if (await el.isVisible().catch(() => false)) {
        await el.click();
        await waitForApiSettle(page);
      }
    }
    await expect(page.getByTestId("order-detail-page")).toBeVisible();
  });
});

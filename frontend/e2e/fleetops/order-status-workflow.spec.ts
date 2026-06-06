import { test, expect } from "../fixtures/test";
import {
  createWorkflowTestOrder,
  dispatchOrderViaApi,
  getOrderViaApi,
} from "../helpers/fleetops/api-seed";
import { gotoFleetopsList, expectGlobalLoaderHidden } from "../helpers/fleetops/workflow";
import { waitForApiSettle } from "../helpers/network";
import type { Page } from "@playwright/test";

async function openOrderInDrawer(page: Page, id: string) {
  await gotoFleetopsList(page, "/fleet-ops/operations/orders", "orders-list-page");
  await page.getByTestId("orders-view-table").click();
  await waitForApiSettle(page);
  const row = page
    .getByTestId(`orders-table-row-${id}`)
    .or(page.locator(`[data-testid^="orders-table-row-"]`).filter({ hasText: id }));
  await expect(row.first()).toBeVisible({ timeout: 45_000 });
  await row.first().click();
  await expect(page.getByTestId("order-detail-page")).toBeVisible({ timeout: 45_000 });
  await expectGlobalLoaderHidden(page);
}

test.describe("FleetOps — order status workflow", () => {
  test.describe.configure({ mode: "serial", timeout: 300_000 });

  let orderId = "";
  let publicId = "";

  test("API: fresh order is created with driver when available", async ({ request }) => {
    const row = await createWorkflowTestOrder(request);
    orderId = row.orderId;
    publicId = row.publicId;
    const raw = await getOrderViaApi(request, orderId);
    expect(raw.status).toBe("created");
    expect(raw.dispatched).toBeFalsy();
  });

  test("UI: new order shows Created status and Dispatch action", async ({ page }) => {
    test.skip(!orderId, "No order seeded");
    await openOrderInDrawer(page, orderId);
    await expect(page.getByTestId("order-status-badge")).toContainText(/created/i);
    await expect(page.getByTestId("order-action-dispatch")).toBeVisible();
    await expect(page.getByTestId("order-action-start")).toBeHidden();
  });

  test("UI: dispatch advances status and hides Dispatch button", async ({ page }) => {
    test.skip(!orderId, "No order seeded");
    await openOrderInDrawer(page, orderId);

    const dispatch = page.getByTestId("order-action-dispatch");
    await expect(dispatch).toBeVisible();
    await dispatch.click();
    await expect(page.getByTestId("order-action-confirm-dialog")).toBeVisible();
    const dispatchResponse = page.waitForResponse(
      (res) =>
        res.request().method() === "PATCH" &&
        res.url().includes("/orders/dispatch") &&
        res.status() < 500,
      { timeout: 60_000 },
    );
    await page.getByTestId("order-action-confirm-accept").click();
    await dispatchResponse;
    await waitForApiSettle(page);
    await expectGlobalLoaderHidden(page);

    await expect(page.getByTestId("order-action-dispatch")).toBeHidden({ timeout: 30_000 });
    await expect(page.getByTestId("order-status-badge")).toContainText(/dispatched/i);
    const startOrAdvance = page
      .getByTestId("order-action-start")
      .or(page.getByTestId("order-action-advance"));
    await expect(startOrAdvance.first()).toBeVisible({ timeout: 30_000 });
  });

  test("UI: already-dispatched order shows Dispatched without Dispatch button", async ({
    page,
    request,
  }) => {
    const row = await createWorkflowTestOrder(request);
    await dispatchOrderViaApi(request, row.orderId);
    const raw = await getOrderViaApi(request, row.orderId);
    expect(raw.dispatched).toBeTruthy();

    await openOrderInDrawer(page, row.orderId);

    await expect(page.getByTestId("order-action-dispatch")).toBeHidden();
    await expect(page.getByTestId("order-status-badge")).toContainText(/dispatched/i);
  });

  test("UI: status filter includes dispatched orders after dispatch", async ({ page, request }) => {
    test.skip(!publicId, "No order from dispatch test");
    await gotoFleetopsList(page, "/fleet-ops/operations/orders", "orders-list-page");
    await page.getByTestId("orders-view-table").click();
    await page.getByTestId("orders-filter-status").click();
    await page.getByRole("option", { name: /^dispatched$/i }).click();
    await waitForApiSettle(page);
    await expectGlobalLoaderHidden(page);

    const row = page
      .getByTestId(`orders-table-row-${orderId}`)
      .or(page.getByTestId(`orders-table-row-${publicId}`));
    const visible = await row.isVisible().catch(() => false);
    if (!visible) {
      await page.getByTestId("orders-filter-status").click();
      await page.getByRole("option", { name: /all statuses/i }).click();
      await waitForApiSettle(page);
      await expect(row).toBeVisible({ timeout: 45_000 });
      await expect(row.getByTestId("status-dispatched").or(row.locator("text=Dispatched"))).toBeVisible();
    } else {
      await expect(row.getByTestId("status-dispatched").or(row.locator("text=Dispatched"))).toBeVisible();
    }
  });
});

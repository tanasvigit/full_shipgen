import { test, expect, type Page } from "@playwright/test";
import { gotoRoute } from "../e2e/helpers/navigation";
import { waitForApiSettle } from "../e2e/helpers/network";
import { expectGlobalLoaderHidden } from "../e2e/helpers/fleetops/workflow";
import { openFirstDetailFromTable } from "../e2e/helpers/page";
import { createOrderViaUI } from "../e2e/helpers/fleetops/create-entity";

/**
 * Screen recording: FleetOps order lifecycle — create -> dispatch -> track.
 *
 * Defensive by design: if the environment cannot create a fresh order
 * (missing order configs or seed entities), it falls back to demonstrating
 * the flow on an existing order and avoids destructive mutations.
 */

async function pause(page: Page, ms = 1200) {
  await page.waitForTimeout(ms);
}

async function showOrderDetailTabs(page: Page) {
  await expectGlobalLoaderHidden(page);
  await expect(page.getByTestId("order-detail-page")).toBeVisible({ timeout: 30_000 });

  // Overview / live map (this is the tracking surface for an order).
  const overviewTab = page.getByTestId("order-tab-overview");
  if (await overviewTab.isVisible().catch(() => false)) {
    await overviewTab.click();
    await pause(page);
  }
  await expect(page.getByTestId("order-map")).toBeVisible({ timeout: 20_000 }).catch(() => {});
  await pause(page, 1500);

  // Activity timeline.
  const activityTab = page.getByTestId("order-tab-activity");
  if (await activityTab.isVisible().catch(() => false)) {
    await activityTab.click();
    await expect(
      page
        .getByTestId("order-activity-timeline")
        .or(page.getByTestId("order-activity-timeline-empty")),
    ).toBeVisible({ timeout: 15_000 }).catch(() => {});
    await pause(page);
  }

  // Documents.
  const documentsTab = page.getByTestId("order-tab-documents");
  if (await documentsTab.isVisible().catch(() => false)) {
    await documentsTab.click();
    await pause(page);
  }

  // Back to overview so the recording ends on the map/tracking view.
  if (await overviewTab.isVisible().catch(() => false)) {
    await overviewTab.click();
    await pause(page);
  }
}

async function demonstrateDispatch(page: Page, canMutate: boolean) {
  const dispatch = page.getByTestId("order-action-dispatch");
  if (!(await dispatch.isVisible().catch(() => false))) {
    return;
  }

  await dispatch.click();
  await expect(page.getByTestId("order-action-confirm-dialog")).toBeVisible({ timeout: 15_000 });
  await pause(page, 1500);

  if (canMutate) {
    // Actually dispatch the freshly created order.
    const confirm = page
      .getByTestId("order-action-confirm-accept")
      .or(page.getByRole("button", { name: /^dispatch$/i }))
      .or(page.getByRole("button", { name: /confirm/i }));
    await confirm.first().click();
    await expectGlobalLoaderHidden(page);
    await waitForApiSettle(page);
    await pause(page, 1500);
  } else {
    // Non-destructive: just show the confirmation, then cancel.
    await page.getByTestId("order-action-confirm-cancel").click();
    await expect(page.getByTestId("order-action-confirm-dialog")).toBeHidden().catch(() => {});
    await pause(page);
  }
}

test("FleetOps order lifecycle — create, dispatch, track", async ({ page }) => {
  // 1. Land on the orders board for context.
  await gotoRoute(page, "/fleet-ops/operations/orders", { pageTestId: "orders-list-page" });
  await waitForApiSettle(page);
  await pause(page, 1500);

  // 2. Try to create a fresh order; fall back to an existing one if seed data is missing.
  let createdFresh = false;
  try {
    await createOrderViaUI(page);
    createdFresh = true;
    await pause(page, 1500);
  } catch (err) {
    console.warn(`[video] Order creation unavailable, using existing order: ${String(err)}`);
    await gotoRoute(page, "/fleet-ops/operations/orders", { pageTestId: "orders-list-page" });
    await waitForApiSettle(page);
    const opened = await openFirstDetailFromTable(page, "orders-table", "order-detail-page");
    expect(opened, "No order available to record").toBeTruthy();
    await pause(page, 1500);
  }

  // 3. Walk the order detail tabs (overview map = tracking, activity, documents).
  await showOrderDetailTabs(page);

  // 4. Demonstrate dispatch (mutate only when we created the order ourselves).
  await demonstrateDispatch(page, createdFresh);

  // 5. Finish on the live map / tracking view.
  await showOrderDetailTabs(page);
});

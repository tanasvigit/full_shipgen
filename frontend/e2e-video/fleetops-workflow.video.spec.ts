import { test, expect, type Page } from "@playwright/test";
import { loginViaUI } from "../e2e/helpers/auth";
import { waitForApiSettle } from "../e2e/helpers/network";
import { expectGlobalLoaderHidden } from "../e2e/helpers/fleetops/workflow";
import { openFirstDetailFromTable } from "../e2e/helpers/page";

/**
 * Complete FleetOps engine walkthrough — starts at the login screen, signs in,
 * then tours every FleetOps area (operations, management, connectivity,
 * maintenance, resources, platform) with a couple of detail dives.
 *
 * Resilient by design: any screen that fails to load is logged and skipped so
 * the recording always completes end-to-end.
 */

async function pause(page: Page, ms = 900) {
  await page.waitForTimeout(ms);
}

/** Navigate to a route and wait for the console shell + optional page test id. */
async function visit(page: Page, label: string, path: string, testId?: string) {
  try {
    await page.goto(path, { waitUntil: "load", timeout: 60_000 });
    await expect(page.getByTestId("console-layout")).toBeVisible({ timeout: 30_000 });
    if (testId) {
      await expect(page.getByTestId(testId))
        .toBeVisible({ timeout: 30_000 })
        .catch(() => {});
    } else {
      await expect(page.getByTestId("page-header"))
        .toBeVisible({ timeout: 20_000 })
        .catch(() => {});
    }
    await expectGlobalLoaderHidden(page).catch(() => {});
    await waitForApiSettle(page).catch(() => {});
    await pause(page);
    // Gentle scroll to reveal more of the page in the recording.
    await page.mouse.wheel(0, 500);
    await pause(page, 700);
    await page.mouse.wheel(0, -500);
    console.log(`[video] visited: ${label} (${path})`);
  } catch (err) {
    console.warn(`[video] skipped ${label} (${path}): ${String(err)}`);
  }
}

async function diveOrderDetail(page: Page) {
  try {
    await page.goto("/fleet-ops/operations/orders", { waitUntil: "load" });
    await expect(page.getByTestId("orders-list-page")).toBeVisible({ timeout: 30_000 });
    await waitForApiSettle(page).catch(() => {});
    const opened = await openFirstDetailFromTable(page, "orders-table", "order-detail-page");
    if (!opened) return;
    await pause(page, 1200);

    for (const tab of ["order-tab-overview", "order-tab-activity", "order-tab-documents", "order-tab-overview"]) {
      const el = page.getByTestId(tab);
      if (await el.isVisible().catch(() => false)) {
        await el.click();
        await pause(page, 1100);
      }
    }

    // Show (but do not commit) the dispatch confirmation.
    const dispatch = page.getByTestId("order-action-dispatch");
    if (await dispatch.isVisible().catch(() => false)) {
      await dispatch.click();
      await expect(page.getByTestId("order-action-confirm-dialog")).toBeVisible({ timeout: 10_000 }).catch(() => {});
      await pause(page, 1300);
      await page.getByTestId("order-action-confirm-cancel").click().catch(() => {});
      await pause(page, 600);
    }
  } catch (err) {
    console.warn(`[video] order detail dive skipped: ${String(err)}`);
  }
}

async function diveDriverDetail(page: Page) {
  try {
    await page.goto("/fleet-ops/management/drivers", { waitUntil: "load" });
    await expect(page.getByTestId("drivers-list-page")).toBeVisible({ timeout: 30_000 });
    await waitForApiSettle(page).catch(() => {});
    const opened = await openFirstDetailFromTable(page, "drivers-table", "driver-detail-page");
    if (opened) await pause(page, 1500);
  } catch (err) {
    console.warn(`[video] driver detail dive skipped: ${String(err)}`);
  }
}

test("Complete FleetOps engine workflow — login + full tour", async ({ page }) => {
  test.setTimeout(600_000);

  // 1. Login (recorded from the auth screen).
  await loginViaUI(page);
  await expect(page.getByTestId("dashboard-page")).toBeVisible({ timeout: 30_000 }).catch(() => {});
  await pause(page, 1800);

  // 2. Operations.
  await visit(page, "Orders", "/fleet-ops/operations/orders", "orders-list-page");
  await diveOrderDetail(page);
  await visit(page, "Routes", "/fleet-ops/operations/routes", "routes-list-page");
  await visit(page, "Schedule", "/fleet-ops/operations/schedule", "schedule-planner-page");
  await visit(page, "Orchestrator", "/fleet-ops/operations/orchestrator", "orchestrator-page");
  await visit(page, "Service rates", "/fleet-ops/operations/service-rates", "service-rates-list-page");
  await visit(page, "Order config", "/fleet-ops/operations/order-config");

  // 3. Management.
  await visit(page, "Drivers", "/fleet-ops/management/drivers", "drivers-list-page");
  await diveDriverDetail(page);
  await visit(page, "Vehicles", "/fleet-ops/management/vehicles", "vehicles-list-page");
  await visit(page, "Places", "/fleet-ops/management/places", "places-list-page");
  await visit(page, "Fleets", "/fleet-ops/management/fleets", "fleets-list-page");
  await visit(page, "Vendors", "/fleet-ops/management/vendors");
  await visit(page, "Contacts", "/fleet-ops/management/contacts");
  await visit(page, "Issues", "/fleet-ops/management/issues");
  await visit(page, "Fuel reports", "/fleet-ops/management/fuel-reports");

  // 4. Connectivity.
  await visit(page, "Fleet tracking", "/fleet-ops/connectivity/tracking");
  await visit(page, "Telematics", "/fleet-ops/connectivity/telematics");
  await visit(page, "Devices", "/fleet-ops/connectivity/devices");
  await visit(page, "Sensors", "/fleet-ops/connectivity/sensors");

  // 5. Maintenance.
  await visit(page, "Maintenance calendar", "/fleet-ops/maintenance/calendar");
  await visit(page, "Maintenance schedules", "/fleet-ops/maintenance/schedules");
  await visit(page, "Work orders", "/fleet-ops/maintenance/work-orders");
  await visit(page, "Equipment", "/fleet-ops/maintenance/equipment");
  await visit(page, "Parts", "/fleet-ops/maintenance/parts");

  // 6. Resources.
  await visit(page, "Manifests", "/fleet-ops/admin/manifests");
  await visit(page, "Payloads", "/fleet-ops/admin/payloads");
  await visit(page, "Proofs", "/fleet-ops/admin/proofs");
  await visit(page, "Tracking numbers", "/fleet-ops/admin/tracking-numbers");

  // 7. Platform.
  await visit(page, "Service areas", "/fleet-ops/service-areas");
  await visit(page, "Custom fields", "/fleet-ops/custom-fields");
  await visit(page, "Track order", "/fleet-ops/tracking/lookup");

  // 8. End on the dashboard.
  await visit(page, "Dashboard", "/", "dashboard-page");
  await pause(page, 1500);
});

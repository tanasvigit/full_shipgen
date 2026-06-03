import { test, expect } from "../fixtures/fleetops-stabilization";
import { gotoRoute } from "../helpers/navigation";

/** Critical console paths — run with `npm run test:e2e:fleetops:smoke` (@smoke). */
const SMOKE_PAGES: { path: string; testId: string }[] = [
  { path: "/fleet-ops/operations/orders", testId: "orders-list-page" },
  { path: "/fleet-ops/operations/orchestrator", testId: "orchestrator-page" },
  { path: "/fleet-ops/operations/routes", testId: "routes-list-page" },
  { path: "/fleet-ops/operations/routes/new", testId: "route-new-page" },
  { path: "/fleet-ops/operations/service-rates", testId: "service-rates-list-page" },
  { path: "/fleet-ops/operations/schedule", testId: "schedule-planner-page" },
  { path: "/fleet-ops/operations/order-config", testId: "order-config-manager-page" },
  { path: "/fleet-ops/connectivity/tracking", testId: "fleet-tracking-hub" },
  { path: "/fleet-ops/connectivity/devices", testId: "device-list-page" },
  { path: "/fleet-ops/maintenance/work-orders", testId: "work-order-list-page" },
  { path: "/fleet-ops/analytics/reports", testId: "report-list-page" },
  { path: "/fleet-ops/settings/navigator", testId: "fleetops-settings-navigator-page" },
  { path: "/fleet-ops/geo/geofences", testId: "geofence-hub-page" },
  { path: "/fleet-ops/admin/warranties", testId: "warranty-list-page" },
];

test.describe("FleetOps Phase 8 — smoke @smoke", { tag: "@smoke" }, () => {
  for (const { path, testId } of SMOKE_PAGES) {
    test(`${path} loads`, async ({ page }) => {
      await gotoRoute(page, path, { pageTestId: testId });
      await expect(page.getByTestId(testId)).toBeVisible({ timeout: 45_000 });
    });
  }

  test("route optimization wizard visible on new route", async ({ page }) => {
    await gotoRoute(page, "/fleet-ops/operations/routes/new", { pageTestId: "route-new-page" });
    await expect(page.getByTestId("route-optimization-wizard")).toBeVisible({ timeout: 45_000 });
  });

  test("orchestrator engine controls visible", async ({ page }) => {
    await gotoRoute(page, "/fleet-ops/operations/orchestrator", { pageTestId: "orchestrator-page" });
    await expect(page.getByTestId("orchestrator-mode")).toBeVisible();
    await expect(page.getByTestId("orchestrator-engine")).toBeVisible();
  });
});

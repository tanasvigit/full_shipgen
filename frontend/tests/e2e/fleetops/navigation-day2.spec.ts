import { test, expect } from "../../../e2e/fixtures/fleetops-stabilization";
import { runViewportMatrix } from "../../../e2e/helpers/fleetops/stabilization";
import { waitForApiSettle } from "../../../e2e/helpers/network";

const DAY2_ROUTES = [
  { slug: "vendors", path: "/fleet-ops/management/vendors", testId: "vendor-list-page" },
  { slug: "contacts", path: "/fleet-ops/management/contacts", testId: "contact-list-page" },
  { slug: "issues", path: "/fleet-ops/management/issues", testId: "issue-list-page" },
  { slug: "telematics", path: "/fleet-ops/connectivity/telematics", testId: "telematic-list-page" },
  { slug: "devices", path: "/fleet-ops/connectivity/devices", testId: "device-list-page" },
  { slug: "sensors", path: "/fleet-ops/connectivity/sensors", testId: "sensor-list-page" },
  { slug: "fleet-tracking", path: "/fleet-ops/connectivity/tracking", testId: "fleet-tracking-hub" },
  { slug: "schedules", path: "/fleet-ops/maintenance/schedules", testId: "maintenance-schedule-list-page" },
  { slug: "work-orders", path: "/fleet-ops/maintenance/work-orders", testId: "work-order-list-page" },
  { slug: "equipment", path: "/fleet-ops/maintenance/equipment", testId: "equipment-list-page" },
  { slug: "parts", path: "/fleet-ops/maintenance/parts", testId: "part-list-page" },
];

test.describe("FleetOps Day 2 — Navigation", () => {
  test("sidebar navigation across Day 2 modules", async ({ page }) => {
    await page.goto("/fleet-ops/operations/orders");
    for (const route of DAY2_ROUTES) {
      const link = page.getByTestId(`sidebar-link-${route.slug}`);
      if (!(await link.isVisible())) continue;
      await link.click();
      await page.waitForURL((url) => url.pathname.startsWith(route.path));
      const forbiddenId = route.testId.replace("-list-page", "-forbidden");
      await expect(page.getByTestId(route.testId).or(page.getByTestId(forbiddenId))).toBeVisible({ timeout: 45_000 });
      await waitForApiSettle(page);
    }
  });

  test("back/forward and reload preserve valid shell state", async ({ page }) => {
    await page.goto("/fleet-ops/management/vendors");
    await expect(page.getByTestId("vendor-list-page").or(page.getByTestId("vendor-forbidden"))).toBeVisible();
    await page.goto("/fleet-ops/connectivity/devices");
    await expect(page.getByTestId("device-list-page").or(page.getByTestId("device-forbidden"))).toBeVisible();
    await page.goBack();
    await expect(page.getByTestId("vendor-list-page").or(page.getByTestId("vendor-forbidden"))).toBeVisible();
    await page.goForward();
    await expect(page.getByTestId("device-list-page").or(page.getByTestId("device-forbidden"))).toBeVisible();
    await page.reload();
    await expect(page.getByTestId("device-list-page").or(page.getByTestId("device-forbidden"))).toBeVisible();
  });

  test("invalid Day 2 route does not crash layout", async ({ page }) => {
    await page.goto("/fleet-ops/management/not-a-real-module");
    await expect(page.getByTestId("console-layout")).toBeVisible({ timeout: 30_000 });
  });

  test("viewport matrix day2 list/detail usability", async ({ page }) => {
    await runViewportMatrix(page, async () => {
      await page.goto("/fleet-ops/management/vendors");
      await expect(page.getByTestId("vendor-list-page").or(page.getByTestId("vendor-forbidden"))).toBeVisible();
      await page.goto("/fleet-ops/connectivity/tracking");
      await expect(page.getByTestId("fleet-tracking-map")).toBeVisible({ timeout: 30_000 });
    });
  });
});

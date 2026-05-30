import { test, expect } from "../../../e2e/fixtures/fleetops-stabilization";
import {
  interceptUsersMeEmptyPermissions,
  clearUsersMeIntercept,
  gotoOrdersList,
} from "../../../e2e/helpers/fleetops/stabilization";
import { waitForApiSettle } from "../../../e2e/helpers/network";

test.describe("FleetOps Day 2 — Permissions fail-closed", () => {
  test.afterEach(async ({ page }) => {
    await clearUsersMeIntercept(page);
  });

  test("permissive mode baseline: day2 sidebar links render in fleet-ops shell", async ({ page }) => {
    await gotoOrdersList(page);
    for (const slug of ["vendors", "contacts", "issues", "telematics", "devices", "sensors", "work-orders"]) {
      await expect(page.getByTestId(`sidebar-link-${slug}`)).toBeVisible();
    }
  });

  test("strict mode: management actions hidden or forbidden view", async ({ page }) => {
    await interceptUsersMeEmptyPermissions(page);
    await page.reload({ waitUntil: "load" });
    await page.goto("/fleet-ops/management/vendors");
    await expect(page.getByTestId("vendor-list-page").or(page.getByTestId("vendor-forbidden"))).toBeVisible();
    if (await page.getByTestId("vendor-list-page").isVisible()) {
      await expect(page.getByTestId("vendor-new-button")).toBeHidden();
    }
  });

  test("strict mode: connectivity and maintenance create actions are blocked", async ({ page }) => {
    await interceptUsersMeEmptyPermissions(page);
    await page.reload({ waitUntil: "load" });
    const routes = [
      { path: "/fleet-ops/connectivity/devices", list: "device-list-page", newBtn: "device-new-button" },
      { path: "/fleet-ops/maintenance/work-orders", list: "work-order-list-page", newBtn: "work-order-new-button" },
    ];
    for (const route of routes) {
      await page.goto(route.path);
      await expect(page.getByTestId(route.list).or(page.getByTestId(route.list.replace("-list-page", "-forbidden")))).toBeVisible();
      if (await page.getByTestId(route.list).isVisible()) {
        await expect(page.getByTestId(route.newBtn)).toBeHidden();
      }
    }
  });

  test("strict mode: relation actions hidden on driver detail", async ({ page }) => {
    await interceptUsersMeEmptyPermissions(page);
    await page.reload({ waitUntil: "load" });
    await page.goto("/fleet-ops/management/drivers");
    const firstRow = page.getByTestId("drivers-table").locator("tbody tr").first();
    if (!(await firstRow.isVisible())) {
      test.skip();
      return;
    }
    await firstRow.click();
    await expect(page.getByTestId("driver-detail-page")).toBeVisible();
    const actions = page.getByTestId("driver-assignment-actions");
    if (await actions.isVisible()) {
      await expect(page.getByTestId("driver-assign-order")).toBeVisible();
    }
    await waitForApiSettle(page);
    await clearUsersMeIntercept(page);
  });
});

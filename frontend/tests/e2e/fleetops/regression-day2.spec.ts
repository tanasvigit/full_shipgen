import { test, expect } from "../../../e2e/fixtures/fleetops-stabilization";
import { gotoOrdersList, openFirstOrderDetail } from "../../../e2e/helpers/fleetops/stabilization";
import { waitForApiSettle } from "../../../e2e/helpers/network";

test.describe.configure({ mode: "serial", timeout: 420_000 });

test.describe("FleetOps Day 2 — Full regression workflow", () => {
  test("operational cross-module workflow remains stable", async ({ page }) => {
    // 1-2 Open orders + filter/search
    await gotoOrdersList(page);
    const search = page.getByTestId("orders-table-search");
    if (await search.isVisible()) {
      await search.fill("e2e");
      await waitForApiSettle(page);
      await search.clear();
    }

    // 3-6 routes/scheduler/assignment continuity
    await page.goto("/fleet-ops/operations/routes");
    await expect(page.getByTestId("routes-list-page")).toBeVisible();
    await page.goto("/fleet-ops/operations/schedule");
    await expect(page.getByTestId("schedule-planner-page")).toBeVisible();
    await gotoOrdersList(page);
    if (await openFirstOrderDetail(page)) {
      const assignBtn = page.getByTestId("order-assign-driver");
      if (await assignBtn.isVisible()) {
        await assignBtn.click();
        await expect(page.getByTestId("assign-driver-dialog")).toBeVisible();
        await page.getByRole("button", { name: /cancel/i }).first().click();
      }
    }

    // 7-8 management checks
    await page.goto("/fleet-ops/management/vendors");
    await expect(page.getByTestId("vendor-list-page").or(page.getByTestId("vendor-forbidden"))).toBeVisible();
    await page.goto("/fleet-ops/management/issues");
    await expect(page.getByTestId("issue-list-page").or(page.getByTestId("issue-forbidden"))).toBeVisible();
    const issueCreate = page.getByTestId("issue-new-button");
    if (await issueCreate.isVisible()) {
      await issueCreate.click();
      await expect(page.getByTestId("issue-create-dialog")).toBeVisible();
      await page.getByRole("button", { name: /cancel/i }).first().click();
    }

    // 9 tracking hub
    await page.goto("/fleet-ops/connectivity/tracking");
    await expect(page.getByTestId("fleet-tracking-map")).toBeVisible({ timeout: 30_000 });

    // 10 vehicle devices
    await page.goto("/fleet-ops/management/vehicles");
    const vehicleRow = page.getByTestId("vehicles-table").locator("tbody tr").first();
    if (await vehicleRow.isVisible()) {
      await vehicleRow.click();
      await expect(page.getByTestId("vehicle-detail-page")).toBeVisible();
      await page.getByTestId("vehicle-tab-devices").click();
      await expect(page.getByTestId("vehicle-devices-tab")).toBeVisible();
    }

    // 11 maintenance work order shell
    await page.goto("/fleet-ops/maintenance/work-orders");
    await expect(page.getByTestId("work-order-list-page").or(page.getByTestId("work-order-forbidden"))).toBeVisible();
    if (await page.getByTestId("work-order-forbidden").isVisible()) {
      await page.reload();
      await expect(page.getByTestId("fleet-tracking-hub").or(page.getByTestId("work-order-forbidden"))).toBeVisible();
      return;
    }
    const workOrderCreate = page.getByTestId("work-order-new-button");
    if (await workOrderCreate.isVisible()) {
      await workOrderCreate.click();
      await expect(page.getByTestId("work-order-create-dialog")).toBeVisible();
      await page.getByRole("button", { name: /cancel/i }).first().click();
    }

    // 12 realtime-style refresh pulse
    await page.goto("/fleet-ops/connectivity/tracking");
    await page.getByTestId("tracking-refresh").click();
    await waitForApiSettle(page);

    // 13-14 reload and persistence
    await page.reload();
    await expect(page.getByTestId("fleet-tracking-hub")).toBeVisible();
  });
});

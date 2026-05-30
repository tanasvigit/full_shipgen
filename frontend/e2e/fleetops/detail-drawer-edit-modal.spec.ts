import { test, expect } from "../fixtures/test";
import { gotoRoute } from "../helpers/navigation";
import { expectDataTableReady, openFirstDetailFromTable } from "../helpers/page";
import { waitForApiSettle } from "../helpers/network";

/**
 * Regression: edit from detail drawer must open centered modal without clearing ?driver= (etc.).
 */
test.describe.configure({ mode: "serial" });

test.describe("FleetOps detail drawer — edit modal", () => {
  test.beforeEach(async ({ page }) => {
    await gotoRoute(page, "/fleet-ops/management/drivers", { pageTestId: "drivers-list-page" });
    await waitForApiSettle(page);
    await expectDataTableReady(page, "drivers-table");
  });

  test("driver: edit opens modal, drawer stays open, URL keeps driver param", async ({ page }) => {
    const opened = await openFirstDetailFromTable(page, "drivers-table", "driver-detail-page");
    test.skip(!opened, "No driver rows in table — seed data or run CRUD setup first");

    await expect(page.getByTestId("driver-detail-drawer")).toBeVisible();
    await expect(page).toHaveURL(/[?&]driver=/);

    const driverParam = new URL(page.url()).searchParams.get("driver");
    expect(driverParam).toBeTruthy();

    await page.getByTestId("driver-edit").click();

    await expect(page).toHaveURL(new RegExp(`[?&]driver=${driverParam}`));
    await expect(page.getByTestId("driver-detail-drawer")).toBeVisible();
    await expect(page.getByTestId("driver-detail-page")).toBeVisible();
    await expect(page.getByTestId("edit-driver-dialog")).toBeVisible({ timeout: 15_000 });
    await expect(page.getByTestId("driver-form")).toBeVisible();

    await page.getByTestId("edit-driver-dialog").getByRole("button", { name: /cancel/i }).click();
    await expect(page.getByTestId("edit-driver-dialog")).toBeHidden();
    await expect(page.getByTestId("driver-detail-drawer")).toBeVisible();
    await expect(page).toHaveURL(new RegExp(`[?&]driver=${driverParam}`));

    await page.getByTestId("driver-edit").click();
    await expect(page.getByTestId("edit-driver-dialog")).toBeVisible();
    await expect(page.getByTestId("driver-form")).toBeVisible();
    await page.getByTestId("edit-driver-dialog").getByRole("button", { name: /cancel/i }).click();
    await expect(page.getByTestId("edit-driver-dialog")).toBeHidden();
  });

  test("order drawer matches standard width (720px desktop)", async ({ page }) => {
    await gotoRoute(page, "/fleet-ops/operations/orders", { pageTestId: "orders-list-page" });
    await waitForApiSettle(page);
    await page.getByTestId("orders-view-table").click();
    await expectDataTableReady(page, "orders-table");

    const opened = await openFirstDetailFromTable(page, "orders-table", "order-detail-page");
    test.skip(!opened, "No order rows in table");

    const drawer = page.getByTestId("order-detail-drawer");
    await expect(drawer).toBeVisible();
    const box = await drawer.boundingBox();
    expect(box).not.toBeNull();
    // Same 720px shell as driver/vehicle/fleet/place drawers (allow border/padding tolerance)
    expect(box!.width).toBeGreaterThan(680);
    expect(box!.width).toBeLessThan(780);
  });

  test("vehicle: edit modal from drawer when rows exist", async ({ page }) => {
    await gotoRoute(page, "/fleet-ops/management/vehicles", { pageTestId: "vehicles-list-page" });
    await waitForApiSettle(page);
    await expectDataTableReady(page, "vehicles-table");

    const opened = await openFirstDetailFromTable(page, "vehicles-table", "vehicle-detail-page");
    test.skip(!opened, "No vehicle rows in table");

    const vehicleParam = new URL(page.url()).searchParams.get("vehicle");
    expect(vehicleParam).toBeTruthy();

    await page.getByTestId("vehicle-edit").click();
    await expect(page).toHaveURL(new RegExp(`[?&]vehicle=${vehicleParam}`));
    await expect(page.getByTestId("vehicle-detail-drawer")).toBeVisible();
    await expect(page.getByTestId("edit-vehicle-dialog")).toBeVisible({ timeout: 15_000 });
    await expect(page.getByTestId("vehicle-form")).toBeVisible();
  });
});

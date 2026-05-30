import { test, expect } from "../fixtures/test";
import { gotoRoute } from "../helpers/navigation";
import { waitForApiSettle } from "../helpers/network";

test.describe("Global loading system", () => {
  test("global loader clears after authenticated dashboard load", async ({ page }) => {
    await gotoRoute(page, "/");
    await expect(page.getByTestId("global-loader")).toBeHidden({ timeout: 30_000 });
    await expect(page.getByTestId("dashboard-page")).toBeVisible();
    await expect(page.getByTestId("route-progress-loader")).toHaveCount(0);
  });

  test("navigation settles without top progress bar or stuck global loader", async ({ page }) => {
    await gotoRoute(page, "/");
    await waitForApiSettle(page);
    await expect(page.getByTestId("route-progress-loader")).toHaveCount(0);
    await page.getByTestId("dashboard-orders-link").click();
    await expect(page).toHaveURL(/fleet-ops\/operations\/orders/);
    await expect(page.getByTestId("orders-list-page")).toBeVisible();
    await expect(page.getByTestId("route-progress-loader")).toHaveCount(0);
    await expect(page.getByTestId("global-loader")).toBeHidden();
  });

  test("table loader on drivers list", async ({ page }) => {
    await gotoRoute(page, "/fleet-ops/management/drivers", { pageTestId: "drivers-list-page" });
    await expect(page.getByTestId("drivers-table-loader-overlay")).toBeHidden({ timeout: 20_000 });
    await expect(page.getByTestId("drivers-table-loader-overlay-spinner")).toBeHidden({ timeout: 20_000 });
    await expect(page.getByTestId("drivers-table")).toBeVisible();
  });

  test("onboard driver dialog shows arc spinner on submit state", async ({ page }) => {
    await gotoRoute(page, "/fleet-ops/management/drivers", { pageTestId: "drivers-list-page" });
    await waitForApiSettle(page);
    await page.getByTestId("drivers-new-button").click();
    await expect(page.getByTestId("onboard-driver-dialog")).toBeVisible();
    await expect(page.getByTestId("driver-form")).toBeVisible();
    await page.getByRole("button", { name: /cancel/i }).first().click();
    await expect(page.getByTestId("onboard-driver-dialog")).toBeHidden();
  });

  test("order form page is reachable without stuck global loader", async ({ page }) => {
    await gotoRoute(page, "/fleet-ops/operations/orders/new", { pageTestId: "order-new-page" });
    await expect(page.getByTestId("global-loader")).toBeHidden({ timeout: 20_000 });
    await expect(page.getByTestId("order-form")).toBeVisible();
  });
});

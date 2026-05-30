import { test, expect } from "../fixtures/test";
import { gotoRoute } from "../helpers/navigation";
import { waitForApiSettle } from "../helpers/network";
import { fillDriverForm } from "../helpers/fleetops/create-entity";
import { e2eUnique } from "../helpers/fleetops/test-data";
import {
  assertArcSpinnerFully,
  assertSpinnerCenteredInContainer,
  delayFleetOpsListGet,
} from "../helpers/loading";

const LIST_DELAY_MS = 2_800;

test.describe("Arc spinner loading animation", () => {
  test("table loader shows rotating arc spinner while drivers list fetch is in flight", async ({ page }) => {
    await delayFleetOpsListGet(page, "drivers", LIST_DELAY_MS);

    await gotoRoute(page, "/fleet-ops/management/drivers", { pageTestId: "drivers-list-page" });

    const spinner = page.getByTestId("drivers-table-loader-overlay-spinner");
    await expect(spinner).toBeVisible({ timeout: 5_000 });
    await assertSpinnerCenteredInContainer(
      page,
      "drivers-table-loader-overlay-spinner",
      "drivers-table-body",
    );
    await assertArcSpinnerFully(spinner);

    await expect(spinner).toBeHidden({ timeout: 20_000 });
    await expect(page.getByTestId("drivers-table")).toBeVisible();
  });

  test("places table loader arc spinner animates while list fetch is delayed", async ({ page }) => {
    await delayFleetOpsListGet(page, "places", LIST_DELAY_MS);

    await gotoRoute(page, "/fleet-ops/management/places", { pageTestId: "places-list-page" });

    const spinner = page.getByTestId("places-table-loader-overlay-spinner");
    await expect(spinner).toBeVisible({ timeout: 5_000 });
    await assertSpinnerCenteredInContainer(
      page,
      "places-table-loader-overlay-spinner",
      "places-table-body",
    );
    await assertArcSpinnerFully(spinner);

    await expect(spinner).toBeHidden({ timeout: 20_000 });
    await expect(page.getByTestId("places-table")).toBeVisible();
  });

  test("global loader overlay uses enterprise arc spinner when bootstrap is delayed", async ({ page }) => {
    let releaseBootstrap = false;

    await page.route(/\/int\/v1\/users\/me/i, async (route) => {
      if (route.request().method() !== "GET") {
        await route.continue();
        return;
      }
      while (!releaseBootstrap) {
        await new Promise((resolve) => setTimeout(resolve, 200));
      }
      await route.continue();
    });

    await page.goto("/", { waitUntil: "commit", timeout: 60_000 });

    const globalLoader = page.getByTestId("global-loader");
    const spinner = page.getByTestId("global-loader-spinner");

    await expect(globalLoader).toBeVisible({ timeout: 10_000 });
    await expect(globalLoader).toHaveAttribute("aria-busy", "true");
    await assertArcSpinnerFully(spinner);

    releaseBootstrap = true;
    await expect(globalLoader).toBeHidden({ timeout: 30_000 });
    await expect(page.getByTestId("console-layout")).toBeVisible();
  });

  test("form submit button shows rotating arc spinner while driver create is in flight", async ({ page }) => {
    await gotoRoute(page, "/fleet-ops/management/drivers", { pageTestId: "drivers-list-page" });
    await waitForApiSettle(page);

    await page.route(/\/int\/v1\/.*drivers(\?|$|\/)/i, async (route) => {
      if (route.request().method() !== "POST") {
        await route.continue();
        return;
      }
      await new Promise((resolve) => setTimeout(resolve, LIST_DELAY_MS));
      await route.continue();
    });

    const data = e2eUnique("SpinnerAnim");

    await page.getByTestId("drivers-new-button").click();
    await expect(page.getByTestId("onboard-driver-dialog")).toBeVisible();
    await expect(page.getByTestId("driver-form")).toBeVisible();
    await fillDriverForm(page, data);

    await page.getByTestId("onboard-driver-dialog-submit").click();

    const spinner = page.getByTestId("form-submit-spinner");
    await expect(spinner).toBeVisible({ timeout: 5_000 });
    await assertArcSpinnerFully(spinner);

    await expect(page.getByTestId("onboard-driver-dialog")).toBeHidden({ timeout: 30_000 });
  });
});

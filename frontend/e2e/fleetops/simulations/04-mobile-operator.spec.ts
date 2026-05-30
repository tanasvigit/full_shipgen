import { test, expect } from "../../fixtures/test";
import { assertDiagnosticsClean } from "../../helpers/fleetops/assertions";
import { createDriverViaUI, createPlaceViaUI } from "../../helpers/fleetops/create-entity";
import { e2eUnique } from "../../helpers/fleetops/test-data";
import { attachScenarioSummary } from "../../helpers/fleetops/scenario-report";
import {
  assertNoStuckViewportLoaders,
} from "../../helpers/fleetops/scenario-health";
import { flushScenarioFindings } from "../../helpers/fleetops/scenario-report";
import { gotoFleetopsList } from "../../helpers/fleetops/workflow";
import { gotoRoute } from "../../helpers/navigation";
import { waitForApiSettle } from "../../helpers/network";

const IPHONE = { width: 390, height: 844 };
const ANDROID = { width: 412, height: 915 };

async function assertMobileOrderSurfaces(page: import("@playwright/test").Page) {
  await gotoFleetopsList(page, "/fleet-ops/operations/orders", "orders-list-page");
  await expect(page.getByTestId("orders-list-page")).toBeVisible();
  const table = page.getByTestId("orders-table");
  await expect(table).toBeVisible();
  const box = await table.boundingBox();
  expect(box).not.toBeNull();
  expect(box!.width).toBeLessThanOrEqual(IPHONE.width);
}

async function assertMobileDialogFits(page: import("@playwright/test").Page) {
  await gotoFleetopsList(page, "/fleet-ops/management/drivers", "drivers-list-page");
  await assertNoStuckViewportLoaders(page);
  await page.getByTestId("drivers-new-button").scrollIntoViewIfNeeded();
  await page.getByTestId("drivers-new-button").click();
  const dialog = page.getByTestId("onboard-driver-dialog");
  await expect(dialog).toBeVisible();
  const dialogBox = await dialog.boundingBox();
  const viewport = page.viewportSize();
  expect(dialogBox).not.toBeNull();
  expect(viewport).not.toBeNull();
  expect(dialogBox!.width).toBeLessThanOrEqual(viewport!.width + 4);
  expect(dialogBox!.x).toBeGreaterThanOrEqual(-4);
  await page.getByRole("button", { name: /cancel/i }).first().click();
  await expect(dialog).toBeHidden();
}

test.describe.configure({ timeout: 180_000 });

test.describe("Simulation 4 — mobile operator", () => {
  test.afterEach(({ }, testInfo) => flushScenarioFindings(testInfo));

  test("iPhone viewport — lists, dialogs, loaders, map entry", async ({ page, diagnostics }, testInfo) => {
    await page.setViewportSize(IPHONE);
    const place = e2eUnique("MobilePlace");
    await createPlaceViaUI(page, place, { verifyTable: false });
    await createDriverViaUI(page, e2eUnique("MobileDriver"), { verifyTable: false });

    await assertMobileOrderSurfaces(page);
    await assertMobileDialogFits(page);
    await assertNoStuckViewportLoaders(page);

    const row = page.locator('[data-testid^="orders-table-row-"]').first();
    if (await row.isVisible()) {
      await row.click();
      await expect(page.getByTestId("order-detail-page")).toBeVisible({ timeout: 30_000 });
      await page.getByTestId("order-tab-overview").click();
      await expect(page.getByTestId("order-map")).toBeVisible();
      const mapBox = await page.getByTestId("order-map").boundingBox();
      expect(mapBox!.width).toBeLessThanOrEqual(IPHONE.width);
    }

    attachScenarioSummary(testInfo, { scenario: "mobile-iphone", viewport: IPHONE });
    assertDiagnosticsClean(diagnostics);
  });

  test("Android viewport — critical workflow surfaces", async ({ page, diagnostics }, testInfo) => {
    await page.setViewportSize(ANDROID);
    await assertMobileOrderSurfaces(page);
    await assertMobileDialogFits(page);
    await waitForApiSettle(page);
    await assertNoStuckViewportLoaders(page);
    attachScenarioSummary(testInfo, { scenario: "mobile-android", viewport: ANDROID });
    assertDiagnosticsClean(diagnostics);
  });
});

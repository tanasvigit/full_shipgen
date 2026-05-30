import { test } from "../../fixtures/test";
import { assertDiagnosticsClean } from "../../helpers/fleetops/assertions";
import { createDriverViaUI, createPlaceViaUI } from "../../helpers/fleetops/create-entity";
import { e2eUnique } from "../../helpers/fleetops/test-data";
import { rapidFleetopsNavigationBurst } from "../../helpers/fleetops/simulations";
import {
  assertDomScaleReasonable,
  assertNoStuckViewportLoaders,
  assertSingleDialogSurface,
} from "../../helpers/fleetops/scenario-health";
import { attachScenarioSummary, flushScenarioFindings } from "../../helpers/fleetops/scenario-report";
import { gotoFleetopsList } from "../../helpers/fleetops/workflow";
import { gotoRoute } from "../../helpers/navigation";
import { waitForApiSettle } from "../../helpers/network";
import { exerciseDataTable, openFleetOpsFormAndCancel, searchDataTable } from "../../helpers/page";

test.describe.configure({ timeout: 360_000 });

test.describe("Simulation 2 — dispatcher heavy usage", () => {
  test.afterEach(({ }, testInfo) => flushScenarioFindings(testInfo));

  test("rapid navigation, search, sort, pagination, dialogs — no stale UI or stuck loaders", async ({
    page,
    diagnostics,
  }, testInfo) => {
    const driver = e2eUnique("DispatchDriver");
    await createPlaceViaUI(page, e2eUnique("DispatchPlace"), { verifyTable: false });
    await createDriverViaUI(page, driver, { verifyTable: false });

    await rapidFleetopsNavigationBurst(page, 2);

    await gotoFleetopsList(page, "/fleet-ops/operations/orders", "orders-list-page");
    await page.getByTestId("orders-view-table").click();
    await exerciseDataTable(page, "orders-table", "e2e");
    await searchDataTable(page, "e2e", "orders-table");
    await waitForApiSettle(page);

    await gotoFleetopsList(page, "/fleet-ops/management/drivers", "drivers-list-page");
    await searchDataTable(page, driver.name, "drivers-table");
    await exerciseDataTable(page, "drivers-table", driver.slug.slice(0, 4));

    await assertNoStuckViewportLoaders(page);
    await openFleetOpsFormAndCancel(page, "drivers-new-button", {
      dialogTestId: "onboard-driver-dialog",
      formTestId: "driver-form",
    });
    await gotoFleetopsList(page, "/fleet-ops/management/places", "places-list-page");
    await openFleetOpsFormAndCancel(page, "places-new-button", {
      dialogTestId: "add-place-dialog",
    });

    await gotoRoute(page, "/fleet-ops/operations/schedule", { pageTestId: "schedule-planner-page" });
    await page.getByTestId("schedule-new").click();
    await assertSingleDialogSurface(page);
    await page.getByRole("button", { name: /cancel/i }).first().click();

    for (let i = 0; i < 4; i++) {
      await page.reload({ waitUntil: "load" });
      await waitForApiSettle(page);
      await assertNoStuckViewportLoaders(page);
    }

    await gotoRoute(page, "/");
    await assertDomScaleReasonable(page);

    attachScenarioSummary(testInfo, {
      scenario: "dispatcher-heavy",
      navigationCycles: 3,
      refreshes: 4,
    });

    assertDiagnosticsClean(diagnostics);
  });
});

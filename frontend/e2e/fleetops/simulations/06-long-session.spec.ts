import { test } from "../../fixtures/test";
import { assertDiagnosticsClean } from "../../helpers/fleetops/assertions";
import { createPlaceViaUI } from "../../helpers/fleetops/create-entity";
import { e2eUnique } from "../../helpers/fleetops/test-data";
import { rapidFleetopsNavigationBurst, simulationLoopCount } from "../../helpers/fleetops/simulations";
import {
  assertDomScaleReasonable,
  assertNoStuckViewportLoaders,
  assertSingleDialogSurface,
} from "../../helpers/fleetops/scenario-health";
import { attachScenarioSummary, flushScenarioFindings } from "../../helpers/fleetops/scenario-report";
import { gotoFleetopsList } from "../../helpers/fleetops/workflow";
import { waitForApiSettle } from "../../helpers/network";
import { exerciseDataTable, openFleetOpsFormAndCancel } from "../../helpers/page";

test.describe.configure({ timeout: 600_000 });

test.describe("Simulation 6 — long session stability", () => {
  test.afterEach(({ }, testInfo) => flushScenarioFindings(testInfo));

  test("dense operational loop — no overlay leaks or runaway DOM", async ({ page, diagnostics }, testInfo) => {
    const loops = simulationLoopCount();
    const started = Date.now();

    await createPlaceViaUI(page, e2eUnique("SessionPlace"), { verifyTable: false });

    for (let i = 0; i < loops; i++) {
      await rapidFleetopsNavigationBurst(page, 1);

      await gotoFleetopsList(page, "/fleet-ops/operations/orders", "orders-list-page");
      await page.getByTestId("orders-view-table").click();
      await exerciseDataTable(page, "orders-table", "a");

      await gotoFleetopsList(page, "/fleet-ops/management/drivers", "drivers-list-page");
      await assertNoStuckViewportLoaders(page);
      await openFleetOpsFormAndCancel(page, "drivers-new-button", {
        dialogTestId: "onboard-driver-dialog",
        formTestId: "driver-form",
      });
      await assertSingleDialogSurface(page);
      await assertNoStuckViewportLoaders(page);

      if (i % 3 === 0) {
        await page.reload({ waitUntil: "load" });
        await waitForApiSettle(page);
      }
    }

    await assertDomScaleReasonable(page, 14_000);

    attachScenarioSummary(testInfo, {
      scenario: "long-session",
      loops,
      elapsedMs: Date.now() - started,
      note: "Set E2E_SIM_LOOPS higher locally to approximate 15–20 min density",
    });

    assertDiagnosticsClean(diagnostics);
  });
});

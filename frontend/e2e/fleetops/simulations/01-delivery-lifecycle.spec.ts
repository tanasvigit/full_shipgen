import { test, expect } from "../../fixtures/test";
import { assertDiagnosticsClean } from "../../helpers/fleetops/assertions";
import { editViaDialog } from "../../helpers/fleetops/create-entity";
import {
  assertActivityTimelineHasEntries,
  assertOrderPersistedAfterReload,
  assertOrderVisibleInList,
  assertOrderWorkflowPanelReady,
  createOperationalSeed,
  createOrderForSimulation,
  provisionOperationalStack,
  runOrderDeliveryLifecycle,
} from "../../helpers/fleetops/simulations";
import { assertNoStuckViewportLoaders } from "../../helpers/fleetops/scenario-health";
import { attachScenarioSummary, flushScenarioFindings } from "../../helpers/fleetops/scenario-report";
import { expectGlobalLoaderHidden } from "../../helpers/fleetops/workflow";
import { waitForApiSettle } from "../../helpers/network";

test.describe.configure({ mode: "serial", timeout: 300_000 });

test.describe("Simulation 1 — full delivery lifecycle", () => {
  test.afterEach(({}, testInfo) => flushScenarioFindings(testInfo));

  test("operator provisions stack, delivers order, reload verifies persistence", async ({
    page,
    diagnostics,
  }, testInfo) => {
    const seed = createOperationalSeed("Lifecycle");
    seed.editedNotes = `${seed.order.notes} — lifecycle persisted`;

    await provisionOperationalStack(page, seed);
    await createOrderForSimulation(page, seed);
    await assertOrderWorkflowPanelReady(page);

    await editViaDialog(page, {
      editButtonTestId: "order-edit",
      dialogTestId: "edit-order-dialog",
      resource: "orders",
      fill: async () => {
        await page.getByTestId("order-field-notes").fill(seed.editedNotes!);
      },
    });

    await expect(page.getByTestId("order-detail-page").getByText(seed.editedNotes!)).toBeVisible();

    const executed = await runOrderDeliveryLifecycle(page);
    attachScenarioSummary(testInfo, {
      scenario: "delivery-lifecycle",
      orderId: seed.orderId,
      workflowActionsExecuted: executed,
      notes: seed.editedNotes,
    });

    expect(executed.length).toBeGreaterThan(0);

    await assertActivityTimelineHasEntries(page);
    await page.getByTestId("order-tab-overview").click();
    await expect(page.getByTestId("order-map")).toBeVisible();

    await assertOrderPersistedAfterReload(page, seed, seed.editedNotes!);
    await page.goto(`/fleet-ops/operations/orders/${seed.orderId}`);
    await expect(page.getByTestId("order-detail-page")).toBeVisible({ timeout: 45_000 });
    await expect(page.getByTestId("order-detail-page").getByText(seed.editedNotes!)).toBeVisible();
    await expectGlobalLoaderHidden(page);
    await assertNoStuckViewportLoaders(page);

    assertDiagnosticsClean(diagnostics);
  });
});

import { test, expect } from "../../fixtures/test";
import { assertDiagnosticsClean } from "../../helpers/fleetops/assertions";
import {
  createOperationalSeed,
  createOrderForSimulation,
  openAuthenticatedTab,
  openOrderDetailById,
  provisionOperationalStack,
  runOrderWorkflowAction,
} from "../../helpers/fleetops/simulations";
import { assertNoStuckViewportLoaders } from "../../helpers/fleetops/scenario-health";
import { attachScenarioSummary, flushScenarioFindings } from "../../helpers/fleetops/scenario-report";
import { waitForApiSettle } from "../../helpers/network";

test.describe.configure({ timeout: 300_000 });

test.describe("Simulation 3 — multi-tab consistency", () => {
  test.afterEach(({ }, testInfo) => flushScenarioFindings(testInfo));

  test("edit/dispatch in one tab reflects after refresh in another", async ({
    browser,
    diagnostics,
  }, testInfo) => {
    const seed = createOperationalSeed("MultiTab");
    seed.editedNotes = `${seed.order.notes} — tab sync`;

    const { context: ctxA, page: tabA } = await openAuthenticatedTab(
      browser,
      "/fleet-ops/operations/orders",
    );
    const { context: ctxB, page: tabB } = await openAuthenticatedTab(
      browser,
      "/fleet-ops/operations/orders",
    );

    try {
      await provisionOperationalStack(tabA, seed);
      await createOrderForSimulation(tabA, seed);

      await tabB.goto(`/fleet-ops/operations/orders/${seed.orderId}`);
      await expect(tabB.getByTestId("order-detail-page")).toBeVisible({ timeout: 45_000 });
      await waitForApiSettle(tabB);

      const editBtn = tabA.getByTestId("order-edit");
      if (await editBtn.isVisible()) {
        await editBtn.click();
        await expect(tabA.getByTestId("edit-order-dialog")).toBeVisible();
        await tabA.getByTestId("order-field-notes").fill(seed.editedNotes!);
        await tabA.getByTestId("edit-order-dialog-submit").click();
        await expect(tabA.getByTestId("edit-order-dialog")).toBeHidden({ timeout: 60_000 });
        await waitForApiSettle(tabA);
      }

      await tabB.reload({ waitUntil: "load" });
      await expect(tabB.getByTestId("order-detail-page")).toBeVisible({ timeout: 45_000 });
      await expect(tabB.getByTestId("order-detail-page").getByText(seed.editedNotes!)).toBeVisible({
        timeout: 30_000,
      });

      const dispatched = await runOrderWorkflowAction(tabA, "dispatch");
      if (dispatched) {
        await tabB.reload({ waitUntil: "load" });
        await waitForApiSettle(tabB);
        await expect(tabB.getByTestId("order-workflow-panel")).toBeVisible();
      }

      await assertNoStuckViewportLoaders(tabA);
      await assertNoStuckViewportLoaders(tabB);

      attachScenarioSummary(testInfo, {
        scenario: "multi-tab",
        orderId: seed.orderId,
        dispatched,
      });
    } finally {
      await ctxA.close();
      await ctxB.close();
    }

    assertDiagnosticsClean(diagnostics);
  });
});

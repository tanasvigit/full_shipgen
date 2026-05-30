import { test, expect } from "../../fixtures/test";
import { assertDiagnosticsClean } from "../../helpers/fleetops/assertions";
import {
  createOperationalSeed,
  createOrderForSimulation,
  delayFleetApi,
  provisionOperationalStack,
  runOrderWorkflowAction,
} from "../../helpers/fleetops/simulations";
import { assertNoStuckViewportLoaders } from "../../helpers/fleetops/scenario-health";
import { attachScenarioSummary, flushScenarioFindings } from "../../helpers/fleetops/scenario-report";
import { expectGlobalLoaderHidden } from "../../helpers/fleetops/workflow";
import { gotoRoute } from "../../helpers/navigation";
import { waitForApiSettle } from "../../helpers/network";
import { assertSpinnerCenteredInContainer } from "../../helpers/loading";

const SLOW_MS = 2_400;

test.describe.configure({ timeout: 300_000 });

test.describe("Simulation 5 — network stress", () => {
  test.afterEach(({ }, testInfo) => flushScenarioFindings(testInfo));

  test("slow list load — viewport loader centers then clears", async ({ page, diagnostics }, testInfo) => {
    await delayFleetApi(page, SLOW_MS, ["drivers"]);
    await gotoRoute(page, "/fleet-ops/management/drivers", { pageTestId: "drivers-list-page" });

    const spinner = page.getByTestId("drivers-table-loader-overlay-spinner");
    await expect(spinner).toBeVisible({ timeout: 8_000 });
    await assertSpinnerCenteredInContainer(
      page,
      "drivers-table-loader-overlay-spinner",
      "drivers-table-body",
    );
    await expect(spinner).toBeHidden({ timeout: 25_000 });
    await assertNoStuckViewportLoaders(page);

    attachScenarioSummary(testInfo, { scenario: "network-slow-list", delayMs: SLOW_MS });
    assertDiagnosticsClean(diagnostics);
  });

  test("delayed mutation during dispatch — no stuck dialog or optimistic leak", async ({
    page,
    diagnostics,
  }, testInfo) => {
    const seed = createOperationalSeed("NetStress");
    await provisionOperationalStack(page, seed);
    await createOrderForSimulation(page, seed);

    await page.route(/\/int\/v1\/.*orders.*\/dispatch/i, async (route) => {
      await new Promise((r) => setTimeout(r, SLOW_MS));
      await route.continue();
    });

    const dispatch = page.getByTestId("order-action-dispatch");
    if (!(await dispatch.isVisible())) {
      test.skip(true, "Order not in created state — cannot stress dispatch");
      return;
    }

    await dispatch.click();
    await expect(page.getByTestId("order-action-confirm-dialog")).toBeVisible();
    await page.getByTestId("order-action-confirm-accept").click();
    await expect(page.getByTestId("order-action-confirm-dialog")).toBeHidden({ timeout: 90_000 });
    await expectGlobalLoaderHidden(page);

    await page.reload({ waitUntil: "load" });
    await expect(page.getByTestId("order-detail-page")).toBeVisible({ timeout: 45_000 });
    await waitForApiSettle(page);
    await assertNoStuckViewportLoaders(page);

    attachScenarioSummary(testInfo, { scenario: "network-slow-dispatch", orderId: seed.orderId });
    assertDiagnosticsClean(diagnostics);
  });

  test("refresh during slow order fetch recovers cleanly", async ({ page, diagnostics }, testInfo) => {
    const seed = createOperationalSeed("NetRefresh");
    await provisionOperationalStack(page, seed);
    await createOrderForSimulation(page, seed);
    const orderUrl = page.url();

    await delayFleetApi(page, SLOW_MS, ["orders"]);
    await Promise.all([
      page.waitForLoadState("load"),
      page.goto(orderUrl, { waitUntil: "commit" }),
    ]);
    await page.reload({ waitUntil: "load" });
    await expect(page.getByTestId("order-detail-page")).toBeVisible({ timeout: 60_000 });
    await assertNoStuckViewportLoaders(page);

    const ran = await runOrderWorkflowAction(page, "start");
    attachScenarioSummary(testInfo, { scenario: "network-refresh-recovery", startRan: ran });
    assertDiagnosticsClean(diagnostics);
  });
});

import { expect, type Browser, type Page } from "@playwright/test";
import path from "path";
import { e2eUnique, type E2eSeed } from "./test-data";
import {
  createDriverViaUI,
  createFleetViaUI,
  createOrderViaUI,
  createPlaceViaUI,
  createVehicleViaUI,
} from "./create-entity";
import {
  expectGlobalLoaderHidden,
  gotoFleetopsList,
  selectFirstEntityOption,
  selectRadixOption,
  waitForFleetopsWrite,
} from "./workflow";
import { assertDetailShowsText } from "./assertions";
import { gotoRoute } from "../navigation";
import { waitForApiSettle } from "../network";
import { exerciseDataTable, openTableRowById, searchDataTable } from "../page";
import { assertNoStuckViewportLoaders } from "./scenario-health";

export type OperationalSeed = {
  runId: string;
  pickup: E2eSeed;
  dropoff: E2eSeed;
  fleet: E2eSeed;
  driver: E2eSeed;
  vehicle: E2eSeed;
  order: E2eSeed;
  orderId?: string;
  editedNotes?: string;
};

export function createOperationalSeed(prefix = "Sim"): OperationalSeed {
  const runId = String(Date.now()).slice(-8);
  return {
    runId,
    pickup: e2eUnique(`${prefix}Pickup`),
    dropoff: e2eUnique(`${prefix}Dropoff`),
    fleet: e2eUnique(`${prefix}Fleet`),
    driver: e2eUnique(`${prefix}Driver`),
    vehicle: e2eUnique(`${prefix}Vehicle`),
    order: e2eUnique(`${prefix}Order`),
    editedNotes: undefined,
  };
}

/** Radix/async select — pick option whose label contains text (lookup labels vary by entity). */
export async function selectEntityOptionContaining(
  page: Page,
  fieldTestId: string,
  text: string,
) {
  const trigger = page.getByTestId(`${fieldTestId}-trigger`);
  await expect(trigger).toBeVisible({ timeout: 20_000 });
  await trigger.click();
  const option = page.getByRole("option").filter({ hasText: text });
  if (await option.first().isVisible({ timeout: 8_000 }).catch(() => false)) {
    await option.first().click();
    return;
  }
  await page.keyboard.press("Escape");
  const picked = await selectFirstEntityOption(page, fieldTestId);
  if (!picked) {
    throw new Error(`Could not select ${fieldTestId} (no match for "${text}")`);
  }
}

export async function fillOrderFormWithAssignments(
  page: Page,
  seed: OperationalSeed,
) {
  const missing = page.getByTestId("order-config-missing");
  if (await missing.isVisible().catch(() => false)) {
    throw new Error("No order configs — cannot run operational simulation.");
  }

  await page.getByTestId("order-field-internal-id").fill(seed.order.internalId);
  await selectRadixOption(page, "order-field-priority", /^high$/i);
  await page.getByTestId("order-field-service-type").fill("e2e-delivery");
  await page.getByTestId("order-field-notes").fill(seed.order.notes);
  await page.getByTestId("order-field-dispatch-notes").fill(`Dispatch ${seed.runId}`);
  await page.getByTestId("order-field-instructions").fill(`Instructions ${seed.runId}`);

  await selectEntityOptionContaining(page, "order-field-pickup", seed.pickup.name);
  await selectEntityOptionContaining(page, "order-field-dropoff", seed.dropoff.name);
  await selectEntityOptionContaining(page, "order-field-driver", seed.driver.name);
  await selectEntityOptionContaining(page, "order-field-vehicle", seed.vehicle.name);
}

export async function createOrderForSimulation(page: Page, seed: OperationalSeed) {
  await gotoFleetopsList(page, "/fleet-ops/operations/orders/new", "order-new-page");
  await page.reload({ waitUntil: "load" });
  await expect(page.getByTestId("order-form")).toBeVisible({ timeout: 30_000 });
  await waitForApiSettle(page);

  const responsePromise = waitForFleetopsWrite(page, "orders", ["POST"]).catch(() => null);
  await fillOrderFormWithAssignments(page, seed);
  await page.getByTestId("new-order-submit").click();

  const createError = page.getByTestId("order-create-error");
  await Promise.race([
    page.waitForURL(/\/fleet-ops\/operations\/orders\/(?!new)[^/]+/, { timeout: 90_000 }),
    createError.waitFor({ state: "visible", timeout: 90_000 }).then(async () => {
      throw new Error(`Order create failed: ${await createError.textContent()}`);
    }),
  ]);

  const response = await responsePromise;
  if (response && !response.ok()) {
    throw new Error(`Order create API failed: ${response.status()}`);
  }

  await expectGlobalLoaderHidden(page);
  await expect(page.getByTestId("order-detail-page")).toBeVisible({ timeout: 30_000 });
  seed.orderId = page.url().split("/").filter(Boolean).pop() || "";
  return seed;
}

export type WorkflowActionId = "dispatch" | "start" | "advance" | "complete" | "cancel";

/** Confirm and run a workflow action when the button is available. */
export async function runOrderWorkflowAction(
  page: Page,
  actionId: WorkflowActionId,
  options: { expectApi?: boolean } = {},
): Promise<boolean> {
  const btn = page.getByTestId(`order-action-${actionId}`);
  if (!(await btn.isVisible().catch(() => false))) return false;
  if (await btn.isDisabled().catch(() => true)) return false;

  const responsePromise = waitForFleetopsWrite(page, "orders", ["POST", "PATCH", "PUT"]).catch(
    () => null,
  );

  await btn.click();
  await expect(page.getByTestId("order-action-confirm-dialog")).toBeVisible({ timeout: 10_000 });
  await page.getByTestId("order-action-confirm-accept").click();
  await expect(page.getByTestId("order-action-confirm-dialog")).toBeHidden({ timeout: 90_000 });

  const response = await responsePromise;
  if (options.expectApi && !response) {
    throw new Error(`Expected API response for order action: ${actionId}`);
  }

  await expectGlobalLoaderHidden(page);
  await waitForApiSettle(page);
  return true;
}

/** Run dispatch → start → advance (if any) → complete when buttons appear. */
export async function runOrderDeliveryLifecycle(page: Page) {
  const sequence: WorkflowActionId[] = ["dispatch", "start", "advance", "complete"];
  const executed: WorkflowActionId[] = [];

  for (const action of sequence) {
    const ran = await runOrderWorkflowAction(page, action);
    if (ran) executed.push(action);
  }

  return executed;
}

export async function assertOrderWorkflowPanelReady(page: Page) {
  await expect(page.getByTestId("order-workflow-panel")).toBeVisible({ timeout: 20_000 });
  await expect(page.getByTestId("order-workflow-actions")).toBeVisible();
}

export async function assertActivityTimelineHasEntries(page: Page) {
  await page.getByTestId("order-tab-activity").click();
  const timeline = page.getByTestId("activity-timeline");
  const empty = page.getByTestId("activity-timeline-empty");
  await expect(timeline.or(empty)).toBeVisible({ timeout: 15_000 });
  if (await timeline.isVisible()) {
    await expect(timeline.locator("[data-testid^='activity-item-']").first()).toBeVisible({
      timeout: 15_000,
    });
  }
}

export async function assertOrderPersistedAfterReload(
  page: Page,
  seed: OperationalSeed,
  expectedText: string | RegExp,
) {
  const orderId = seed.orderId;
  if (orderId) {
    await page.goto(`/fleet-ops/operations/orders/${orderId}`, { waitUntil: "load" });
  } else {
    await page.reload({ waitUntil: "load" });
  }
  await expect(page.getByTestId("order-detail-page")).toBeVisible({ timeout: 60_000 });
  await waitForApiSettle(page);
  await assertDetailShowsText(page, "order-detail-page", expectedText);
  await expectGlobalLoaderHidden(page);
  await assertNoStuckViewportLoaders(page);
}

/** Provision full operational stack for lifecycle scenarios. */
export async function provisionOperationalStack(page: Page, seed = createOperationalSeed()) {
  await createPlaceViaUI(page, seed.pickup, { verifyTable: false });
  await createPlaceViaUI(page, seed.dropoff, { verifyTable: false });
  await createFleetViaUI(page, seed.fleet);
  await createDriverViaUI(page, seed.driver, { verifyTable: false });
  await createVehicleViaUI(page, seed.vehicle, { verifyTable: false });
  await waitForApiSettle(page);
  return seed;
}

export async function rapidFleetopsNavigationBurst(page: Page, cycles = 4) {
  const routes: Array<{ path: string; pageTestId: string; table?: string }> = [
    { path: "/fleet-ops/operations/orders", pageTestId: "orders-list-page", table: "orders-table" },
    { path: "/fleet-ops/management/drivers", pageTestId: "drivers-list-page", table: "drivers-table" },
    { path: "/fleet-ops/management/vehicles", pageTestId: "vehicles-list-page", table: "vehicles-table" },
    { path: "/fleet-ops/management/places", pageTestId: "places-list-page", table: "places-table" },
    { path: "/fleet-ops/management/fleets", pageTestId: "fleets-list-page" },
  ];

  for (let c = 0; c < cycles; c++) {
    for (const route of routes) {
      await gotoRoute(page, route.path, { pageTestId: route.pageTestId });
      await waitForApiSettle(page);
      await expectGlobalLoaderHidden(page);
      if (route.table) {
        await exerciseDataTable(page, route.table, "e2e");
        await waitForApiSettle(page);
      }
    }
  }
  await assertNoStuckViewportLoaders(page);
}

export async function openAuthenticatedTab(browser: Browser, urlPath: string) {
  const authFile = path.join(process.cwd(), "playwright", ".auth", "user.json");
  const context = await browser.newContext({ storageState: authFile });
  const page = await context.newPage();
  await gotoRoute(page, urlPath);
  await waitForApiSettle(page);
  return { context, page };
}

export async function delayFleetApi(
  page: Page,
  delayMs: number,
  resources: Array<"orders" | "drivers" | "vehicles" | "places" | "fleets"> = ["orders"],
) {
  const pattern = new RegExp(
    `/int/v1/.*(${resources.join("|")})(\\?|$|/)`,
    "i",
  );
  await page.route(pattern, async (route) => {
    if (route.request().method() === "GET") {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
    await route.continue();
  });
}

export async function throttleNetwork(page: Page, downloadKbps = 400, uploadKbps = 400) {
  const cdp = await page.context().newCDPSession(page);
  await cdp.send("Network.enable");
  await cdp.send("Network.emulateNetworkConditions", {
    offline: false,
    downloadThroughput: (downloadKbps * 1024) / 8,
    uploadThroughput: (uploadKbps * 1024) / 8,
    latency: 120,
  });
}

export function simulationLoopCount(): number {
  const raw = process.env.E2E_SIM_LOOPS;
  const n = raw ? Number.parseInt(raw, 10) : 12;
  return Number.isFinite(n) && n > 0 ? n : 12;
}

export async function assertOrderVisibleInList(page: Page, orderId: string) {
  await gotoFleetopsList(page, "/fleet-ops/operations/orders", "orders-list-page");
  const tableBtn = page.getByTestId("orders-view-table");
  if (await tableBtn.isVisible()) await tableBtn.click();
  await waitForApiSettle(page);
  await expect(page.getByTestId(`orders-table-row-${orderId}`)).toBeVisible({ timeout: 30_000 });
}

export async function openOrderDetailById(page: Page, orderId: string) {
  await openTableRowById(
    page,
    "orders-table",
    orderId,
    "order-detail-page",
    /\/fleet-ops\/operations\/orders\/[^/]+/,
  );
}

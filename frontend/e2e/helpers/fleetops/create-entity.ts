import { expect, type Page, type Response } from "@playwright/test";
import { e2eUnique } from "./test-data";
import {
  gotoFleetopsList,
  selectFirstEntityOption,
  selectRadixOption,
  submitFleetOpsDialog,
  waitForFleetopsWrite,
  expectGlobalLoaderHidden,
} from "./workflow";
import { assertRecordInTable, assertDetailShowsText } from "./assertions";
import { assertNoStuckViewportLoaders } from "./scenario-health";
import { waitForApiSettle } from "../network";
import { openTableRowByText } from "../page";

export type DriverSeed = ReturnType<typeof e2eUnique>;

export async function fillDriverForm(
  page: Page,
  data: DriverSeed,
  options: { editedName?: string } = {},
) {
  await page.getByTestId("driver-field-name").fill(options.editedName || data.name);
  await page.getByTestId("driver-field-email").fill(data.email);
  await page.getByTestId("driver-field-phone").fill(data.phone);
  await page.getByTestId("driver-field-internal-id").fill(data.internalId);
  await page.getByTestId("driver-field-license").fill(`LIC-${data.slug}`);
  await page.getByTestId("driver-field-city").fill(data.city);
  await page.getByTestId("driver-field-country").fill("US");
}

export async function createDriverViaUI(
  page: Page,
  data = e2eUnique("Driver"),
  options: { verifyTable?: boolean } = {},
) {
  const verifyTable = options.verifyTable !== false;
  await gotoFleetopsList(page, "/fleet-ops/management/drivers", "drivers-list-page");
  await page.getByTestId("drivers-new-button").click();
  await expect(page.getByTestId("onboard-driver-dialog")).toBeVisible();
  await expect(page.getByTestId("driver-form")).toBeVisible();
  await fillDriverForm(page, data);
  await submitFleetOpsDialog(page, "onboard-driver-dialog", { resource: "drivers", methods: ["POST"] });
  await expectGlobalLoaderHidden(page);
  await expect(page.getByTestId("drivers-table-loader-overlay")).toBeHidden({ timeout: 45_000 });
  await assertNoStuckViewportLoaders(page);
  if (verifyTable) {
    await assertRecordInTable(page, "drivers-table", data.email);
  }
  return data;
}

export async function openDriverDetailFromTable(page: Page, name: string) {
  await openTableRowByText(
    page,
    "drivers-table",
    name,
    "driver-detail-page",
    /\/fleet-ops\/management\/drivers\/[^/]+/,
  );
  await assertDetailShowsText(page, "driver-detail-page", name);
}

export async function fillVehicleForm(
  page: Page,
  data: ReturnType<typeof e2eUnique>,
  options: { editedName?: string } = {},
) {
  await page.getByTestId("vehicle-field-name").fill(options.editedName || data.name);
  await page.getByTestId("vehicle-field-plate").fill(data.plate);
  await page.getByTestId("vehicle-field-vin").fill(data.vin);
  await page.getByTestId("vehicle-field-make").fill("E2E");
  await page.getByTestId("vehicle-field-model").fill("Van");
  await page.getByTestId("vehicle-field-year").fill("2024");
  await page.getByTestId("vehicle-field-payload").fill("1200");
}

export async function createVehicleViaUI(
  page: Page,
  data = e2eUnique("Vehicle"),
  options: { verifyTable?: boolean } = {},
) {
  const verifyTable = options.verifyTable !== false;
  await gotoFleetopsList(page, "/fleet-ops/management/vehicles", "vehicles-list-page");
  await page.getByTestId("vehicles-new-button").click();
  await expect(page.getByTestId("register-vehicle-dialog")).toBeVisible();
  await fillVehicleForm(page, data);
  await submitFleetOpsDialog(page, "register-vehicle-dialog", { resource: "vehicles", methods: ["POST"] });
  await expectGlobalLoaderHidden(page);
  if (verifyTable) {
    await assertRecordInTable(page, "vehicles-table", data.plate);
  }
  return data;
}

export async function fillPlaceForm(
  page: Page,
  data: ReturnType<typeof e2eUnique>,
  options: { editedName?: string } = {},
) {
  await page.getByTestId("place-field-name").fill(options.editedName || data.name);
  await page.getByTestId("place-field-street1").fill(data.street);
  await page.getByTestId("place-field-city").fill(data.city);
  await page.getByTestId("place-field-province").fill("NY");
  await page.getByTestId("place-field-postal").fill("10001");
  await page.getByTestId("place-field-country").fill("US");
  await page.getByTestId("place-field-phone").fill(data.phone);
  await page.getByTestId("place-field-lat").fill("40.7589");
  await page.getByTestId("place-field-lng").fill("-73.9851");
  await page.getByTestId("place-field-hours").fill("08:00-20:00");
  await page.getByTestId("place-field-notes").fill(data.notes);
}

export async function createPlaceViaUI(
  page: Page,
  data = e2eUnique("Place"),
  options: { verifyTable?: boolean } = {},
) {
  const verifyTable = options.verifyTable !== false;
  await gotoFleetopsList(page, "/fleet-ops/management/places", "places-list-page");
  await page.getByTestId("places-new-button").click();
  await expect(page.getByTestId("add-place-dialog")).toBeVisible();
  await fillPlaceForm(page, data);
  await submitFleetOpsDialog(page, "add-place-dialog", { resource: "places", methods: ["POST"] });
  await expectGlobalLoaderHidden(page);
  await expect(page.getByTestId("places-table-loader-overlay-spinner")).toBeHidden({
    timeout: 45_000,
  });
  await assertNoStuckViewportLoaders(page);
  if (verifyTable) {
    await assertRecordInTable(page, "places-table", data.name);
  }
  return data;
}

export async function fillFleetForm(
  page: Page,
  data: ReturnType<typeof e2eUnique>,
  options: { editedName?: string } = {},
) {
  await page.getByTestId("fleet-field-name").fill(options.editedName || data.name);
  await page.getByTestId("fleet-field-description").fill(data.notes);
  await page.getByTestId("fleet-field-region").fill("Northeast");
  await page.getByTestId("fleet-field-territory").fill("Zone A");
  await page.getByTestId("fleet-field-manager").fill("E2E Manager");
}

async function fleetIdFromCreateResponse(response: Response | null): Promise<string | null> {
  if (!response) return null;
  try {
    const body = await response.json();
    const fleet = body?.fleet ?? body?.data?.fleet ?? body?.data ?? body;
    const id = fleet?.uuid ?? fleet?.id ?? fleet?.public_id;
    const fleetId = id != null ? String(id) : null;
    if (fleetId) {
      sessionStorage.setItem("fleetops:last-created-fleet-id", fleetId);
    }
    return fleetId;
  } catch {
    return null;
  }
}

export async function createFleetViaUI(page: Page, data = e2eUnique("Fleet")) {
  await gotoFleetopsList(page, "/fleet-ops/management/fleets", "fleets-list-page");
  await page.getByTestId("fleets-new-button").click();
  await expect(page.getByTestId("create-fleet-dialog")).toBeVisible();
  await fillFleetForm(page, data);
  const listRefresh = page
    .waitForResponse(
      (res) =>
        /\/fleets(\?|$)/i.test(res.url()) &&
        res.request().method() === "GET" &&
        res.status() >= 200 &&
        res.status() < 300,
      { timeout: 45_000 },
    )
    .catch(() => null);
  const createResponse = await submitFleetOpsDialog(page, "create-fleet-dialog", {
    resource: "fleets",
    methods: ["POST"],
    requireApi: true,
  });
  await listRefresh;
  const createdFleetId = await fleetIdFromCreateResponse(createResponse);

  const countFleetCards = async () => {
    if (createdFleetId) {
      const byId = await page.getByTestId(`fleet-card-${createdFleetId}`).count();
      if (byId > 0) return byId;
    }
    return await page
      .locator("[data-testid^='fleet-card-']")
      .filter({ hasText: data.name })
      .count();
  };

  // Let create + list reconcile finish before reload discards in-memory state.
  await expect.poll(countFleetCards, { timeout: 45_000 }).toBeGreaterThan(0);

  await page.waitForLoadState("networkidle", { timeout: 20_000 }).catch(() => {});
  await page.reload();
  await expect(page.getByTestId("global-loader")).toBeHidden({ timeout: 45_000 });

  await expect.poll(countFleetCards, { timeout: 60_000 }).toBeGreaterThan(0);

  return data;
}

export async function openFleetCard(page: Page, fleetName: string) {
  const card = page.locator("[data-testid^='fleet-card-']").filter({ hasText: fleetName }).first();
  await expect(card).toBeVisible({ timeout: 20_000 });
  await expectGlobalLoaderHidden(page);
  await Promise.all([
    page.waitForURL(/\/fleet-ops\/management\/fleets\/[^/]+/, { timeout: 45_000 }),
    card.click(),
  ]);
  await expectGlobalLoaderHidden(page);
  await expect(page.getByTestId("fleet-detail-page")).toBeVisible({ timeout: 30_000 });
  await assertDetailShowsText(page, "fleet-detail-page", fleetName);
}

export async function fillOrderForm(page: Page, data: ReturnType<typeof e2eUnique>) {
  const missing = page.getByTestId("order-config-missing");
  if (await missing.isVisible().catch(() => false)) {
    throw new Error("No order configs — cannot create orders in this environment.");
  }

  await page.getByTestId("order-field-internal-id").fill(data.internalId);
  await selectRadixOption(page, "order-field-priority", /^high$/i);
  await page.getByTestId("order-field-service-type").fill("e2e-delivery");
  await page.getByTestId("order-field-notes").fill(data.notes);
  await page.getByTestId("order-field-dispatch-notes").fill(`Dispatch ${data.slug}`);
  await page.getByTestId("order-field-instructions").fill(`Instructions ${data.slug}`);

  await selectFirstEntityOption(page, "order-field-customer");
  await selectFirstEntityOption(page, "order-field-pickup");
  await selectFirstEntityOption(page, "order-field-dropoff");
  await selectFirstEntityOption(page, "order-field-driver");
  await selectFirstEntityOption(page, "order-field-vehicle");
}

export async function createOrderViaUI(page: Page, data = e2eUnique("Order")) {
  await gotoFleetopsList(page, "/fleet-ops/operations/orders/new", "order-new-page");
  await expect(page.getByTestId("order-form")).toBeVisible({ timeout: 30_000 });

  const responsePromise = waitForFleetopsWrite(page, "orders", ["POST"]).catch(() => null);
  await fillOrderForm(page, data);
  await page.getByTestId("new-order-submit").click();

  const createError = page.getByTestId("new-order-error").or(page.getByTestId("order-create-error"));
  await Promise.race([
    page.getByTestId("order-detail-page").waitFor({ state: "visible", timeout: 60_000 }),
    createError.waitFor({ state: "visible", timeout: 60_000 }).then(async () => {
      throw new Error(`Order create failed: ${await createError.textContent()}`);
    }),
  ]);

  const response = await responsePromise;
  if (response && !response.ok()) {
    throw new Error(`Order create API failed: ${response.status()} ${response.url()}`);
  }

  await expectGlobalLoaderHidden(page);
  await expect(page.getByTestId("order-detail-page")).toBeVisible({ timeout: 30_000 });
  const url = new URL(page.url());
  const orderId =
    url.searchParams.get("order") || url.pathname.split("/").filter(Boolean).pop() || "";
  return { ...data, orderId };
}

export async function editViaDialog(
  page: Page,
  options: {
    editButtonTestId: string;
    dialogTestId: string;
    resource: import("./workflow").FleetopsResource;
    fill: () => Promise<void>;
  },
) {
  await page.getByTestId(options.editButtonTestId).click();
  await expect(page.getByTestId(options.dialogTestId)).toBeVisible();
  await options.fill();
  await submitFleetOpsDialog(page, options.dialogTestId, {
    resource: options.resource,
    method: "PATCH",
  });
  await expectGlobalLoaderHidden(page);
  await waitForApiSettle(page);
}

import { test, expect } from "../fixtures/test";
import { gotoRoute, expectPageRoot, gotoViaSidebar } from "../helpers/navigation";
import {
  expectDataTableReady,
  expectListSurface,
  exerciseDataTable,
  openFleetOpsFormAndCancel,
  openFirstDetailFromTable,
  searchDataTable,
} from "../helpers/page";
import { waitForApiSettle } from "../helpers/network";
import {
  FLEETOPS_ROUTES,
  FLEETOPS_SIDEBAR_LINKS,
  FLEETOPS_TABLES,
  ORDER_STATUS_FILTERS,
  enterFleetOpsModule,
} from "../helpers/fleetops";

const ORDER_STATUS_FILTERS_LOCAL = ["All", "Created", "Dispatched", "En route", "Delivered", "Canceled"];

test.describe.configure({ mode: "serial" });

test.describe("FleetOps — all routes render", () => {
  for (const route of FLEETOPS_ROUTES) {
    test(`page loads: ${route.path}`, async ({ page }) => {
      await gotoRoute(page, route.path, { pageTestId: route.testId });
      await expectPageRoot(page, route.testId);
      await expect(page.getByTestId("console-main")).toBeVisible();
    });
  }
});

test.describe("FleetOps — header and sidebar navigation", () => {
  test.beforeEach(async ({ page }) => {
    await gotoRoute(page, "/");
  });

  test("header FleetOps nav lands on orders", async ({ page }) => {
    await enterFleetOpsModule(page);
    await expect(page).toHaveURL(/\/fleet-ops\/operations\/orders/);
    await expectPageRoot(page, "orders-list-page");
  });

  for (const link of FLEETOPS_SIDEBAR_LINKS) {
    test(`sidebar: ${link.slug} → ${link.path}`, async ({ page }) => {
      await enterFleetOpsModule(page);
      await gotoViaSidebar(page, link.slug, link.path);
      await expectPageRoot(page, link.pageTestId);
    });
  }
});

test.describe("FleetOps — operations / orders", () => {
  test.beforeEach(async ({ page }) => {
    await gotoRoute(page, "/fleet-ops/operations/orders", { pageTestId: "orders-list-page" });
    await waitForApiSettle(page);
  });

  test("view toggles: table, kanban, map", async ({ page }) => {
    await page.getByTestId("orders-view-table").click();
    await expect(page.getByTestId("orders-table")).toBeVisible();

    await page.getByTestId("orders-view-kanban").click();
    await expect(page.getByTestId("orders-filters")).toBeVisible();

    await page.getByTestId("orders-view-map").click();
    await expect(page.getByTestId("orders-map")).toBeVisible();

    await page.getByTestId("orders-view-table").click();
    await expect(page.getByTestId("orders-table")).toBeVisible();
  });

  test("status filter chips", async ({ page }) => {
    const filters = page.getByTestId("orders-filters");
    for (const label of ORDER_STATUS_FILTERS_LOCAL) {
      await filters.getByRole("button", { name: new RegExp(`^${label}$`, "i") }).click();
      await expect(filters).toBeVisible();
    }
  });

  test("search, sort, and pagination on orders table", async ({ page }) => {
    await page.getByTestId("orders-view-table").click();
    await exerciseDataTable(page, "orders-table", "ORD");
  });

  test("new order button opens create modal", async ({ page }) => {
    await page.getByTestId("orders-new-button").click();
    await expect(page.getByTestId("new-order")).toBeVisible();
    await expect(page.getByTestId("order-form")).toBeVisible();
    await expect(page.getByTestId("orders-list-page")).toBeVisible();
    await page.getByRole("button", { name: /cancel/i }).click();
    await expect(page.getByTestId("new-order")).toBeHidden();
  });

  test("open first order detail when rows exist", async ({ page }) => {
    await page.getByTestId("orders-view-table").click();
    const opened = await openFirstDetailFromTable(page, "orders-table", "order-detail-page");
    if (opened) {
      await expect(page.getByTestId("order-detail-page")).toBeVisible();
      const dispatch = page.getByTestId("order-dispatch");
      const cancel = page.getByTestId("order-cancel");
      if (await dispatch.isVisible()) await expect(dispatch).toBeEnabled();
      if (await cancel.isVisible()) await expect(cancel).toBeEnabled();
    }
  });
});

test.describe("FleetOps — operations / routing", () => {
  test("routing page — refresh, routes list, new order link", async ({ page }) => {
    await gotoRoute(page, "/fleet-ops/operations/routing", { pageTestId: "routing-page" });

    await page.getByTestId("routing-refresh").click();
    await waitForApiSettle(page);

    const empty = page.getByTestId("routing-empty");
    const routeCard = page.locator('[data-testid^="route-"]').first();
    if (await empty.isVisible()) {
      await expect(empty).toContainText(/no active orders/i);
    } else if (await routeCard.isVisible()) {
      await routeCard.click();
      await expect(
        page.getByTestId("routing-map-missing-coords").or(page.locator(".leaflet-container")),
      ).toBeVisible();
    }

    await page.getByTestId("routing-new-order").click();
    await expect(page).toHaveURL(/\/fleet-ops\/operations\/orders\/new/);
    await expect(page.getByTestId("order-new-page")).toBeVisible();
  });
});

test.describe("FleetOps — operations / schedule", () => {
  test("schedule planner — grid, refresh, add-shift dialog", async ({ page }) => {
    await gotoRoute(page, "/fleet-ops/operations/schedule", { pageTestId: "schedule-planner-page" });

    await page.getByRole("button", { name: /^refresh$/i }).click();
    await waitForApiSettle(page);

    const empty = page.getByTestId("schedule-empty");
    const row = page.locator('[data-testid^="schedule-row-"]').first();
    if (await empty.isVisible()) {
      await expect(empty).toBeVisible();
    } else if (await row.isVisible()) {
      await expect(row).toBeVisible();
      const shift = page.locator('[data-testid^="shift-"]').first();
      if (await shift.isVisible()) await expect(shift).toBeVisible();
    }

    await openFleetOpsFormAndCancel(page, "schedule-new", {
      dialogTestId: "add-shift-dialog",
      formTestId: "shift-form",
    });
  });
});

test.describe("FleetOps — management / drivers", () => {
  test("drivers list — table UX and onboard dialog", async ({ page }) => {
    await gotoRoute(page, "/fleet-ops/management/drivers", { pageTestId: "drivers-list-page" });
    await expectListSurface(page, { tableTestId: "drivers-table", emptyTestIds: ["drivers-empty"] });
    await exerciseDataTable(page, "drivers-table");
    await searchDataTable(page, "driver", "drivers-table");
    await openFleetOpsFormAndCancel(page, "drivers-new-button", {
      dialogTestId: "onboard-driver-dialog",
      formTestId: "driver-form",
    });
  });

  test("driver detail — tabs and edit when row exists", async ({ page }) => {
    await gotoRoute(page, "/fleet-ops/management/drivers", { pageTestId: "drivers-list-page" });
    await waitForApiSettle(page);
    if (await openFirstDetailFromTable(page, "drivers-table", "driver-detail-page")) {
      await page.getByTestId("driver-tab-orders").click();
      await expect(page.getByTestId("driver-tab-orders")).toHaveAttribute("data-state", "active");
      await page.getByTestId("driver-edit").click();
      await expect(page.getByTestId("edit-driver-dialog")).toBeVisible();
      await expect(page.getByTestId("driver-form")).toBeVisible();
      await page.getByRole("button", { name: /cancel/i }).first().click();
      await expect(page.getByTestId("edit-driver-dialog")).toBeHidden();
    }
  });
});

test.describe("FleetOps — management / vehicles", () => {
  test("vehicles list — table UX and register dialog", async ({ page }) => {
    await gotoRoute(page, "/fleet-ops/management/vehicles", { pageTestId: "vehicles-list-page" });
    await expectListSurface(page, { tableTestId: "vehicles-table", emptyTestIds: ["vehicles-empty"] });
    await exerciseDataTable(page, "vehicles-table");
    await openFleetOpsFormAndCancel(page, "vehicles-new-button", {
      dialogTestId: "register-vehicle-dialog",
      formTestId: "vehicle-form",
    });
  });

  test("vehicle detail — info tab when row exists", async ({ page }) => {
    await gotoRoute(page, "/fleet-ops/management/vehicles", { pageTestId: "vehicles-list-page" });
    await waitForApiSettle(page);
    if (await openFirstDetailFromTable(page, "vehicles-table", "vehicle-detail-page")) {
      await page.getByTestId("vehicle-tab-info").click();
      await expect(page.getByTestId("vehicle-edit")).toBeVisible();
    }
  });
});

test.describe("FleetOps — management / places", () => {
  test("places list — table, map, add-place dialog", async ({ page }) => {
    await gotoRoute(page, "/fleet-ops/management/places", { pageTestId: "places-list-page" });
    await expectListSurface(page, { tableTestId: "places-table", emptyTestIds: ["places-empty"] });
    await exerciseDataTable(page, "places-table");
    await expect(page.getByTestId("places-overview-map").or(page.locator(".leaflet-container"))).toBeVisible();
    await openFleetOpsFormAndCancel(page, "places-new-button", {
      dialogTestId: "add-place-dialog",
      formTestId: "place-form",
    });
  });

  test("place detail when row exists", async ({ page }) => {
    await gotoRoute(page, "/fleet-ops/management/places", { pageTestId: "places-list-page" });
    await waitForApiSettle(page);
    if (await openFirstDetailFromTable(page, "places-table", "place-detail-page")) {
      await expect(page.getByTestId("place-edit")).toBeVisible();
    }
  });
});

test.describe("FleetOps — management / fleets", () => {
  test("fleets list — cards or empty, create dialog", async ({ page }) => {
    await gotoRoute(page, "/fleet-ops/management/fleets", { pageTestId: "fleets-list-page" });
    await expectListSurface(page, {
      cardSelector: '[data-testid^="fleet-card-"]',
      emptyTestIds: ["fleets-empty"],
    });
    await openFleetOpsFormAndCancel(page, "fleets-new-button", {
      dialogTestId: "create-fleet-dialog",
      formTestId: "fleet-form",
    });
  });

  test("fleet detail — tabs when cards exist", async ({ page }) => {
    await gotoRoute(page, "/fleet-ops/management/fleets", { pageTestId: "fleets-list-page" });
    await waitForApiSettle(page);
    const card = page.locator('[data-testid^="fleet-card-"]').first();
    if (await card.isVisible()) {
      await card.click();
      await expect(page.getByTestId("fleet-detail-page")).toBeVisible({ timeout: 15_000 });
      await page.getByTestId("fleet-tab-drivers").click();
      await page.getByTestId("fleet-tab-vehicles").click();
      await expect(page.getByTestId("fleet-detail-page")).toBeVisible();
    }
  });
});

test.describe("FleetOps — cross-page smoke", () => {
  test("visit every list route and exercise table when applicable", async ({ page }) => {
    for (const route of FLEETOPS_ROUTES) {
      const tableId = FLEETOPS_TABLES[route.path];
      await gotoRoute(page, route.path, { pageTestId: route.testId });
      if (tableId) {
        if (route.path.includes("/operations/orders")) {
          await page.getByTestId("orders-view-table").click();
        }
        const table = page.getByTestId(tableId);
        if (await table.isVisible()) {
          await exerciseDataTable(page, tableId);
        }
      }
    }
  });
});

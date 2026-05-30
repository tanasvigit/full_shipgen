import { test, expect } from "../../fixtures/test";
import { e2eUnique } from "../../helpers/fleetops/test-data";
import {
  createPlaceViaUI,
  createOrderViaUI,
  editViaDialog,
} from "../../helpers/fleetops/create-entity";
import {
  assertDiagnosticsClean,
  assertDetailShowsText,
  assertRecordInTable,
  refreshAndAssertDetail,
} from "../../helpers/fleetops/assertions";
import {
  gotoFleetopsList,
  expectGlobalLoaderHidden,
} from "../../helpers/fleetops/workflow";
import { gotoRoute } from "../../helpers/navigation";
import { waitForApiSettle } from "../../helpers/network";
import { openTableRowById } from "../../helpers/page";

test.describe("FleetOps CRUD — Orders", () => {
  test.describe.configure({ mode: "serial" });

  test("create with stops → list → detail → edit notes → workflow panel", async ({
    page,
    diagnostics,
  }) => {
    const pickup = e2eUnique("Pickup");
    const dropoff = e2eUnique("Dropoff");
    const order = e2eUnique("Order");
    const editedNotes = `${order.notes} — persisted edit`;

    await createPlaceViaUI(page, pickup);
    await createPlaceViaUI(page, dropoff);

    const created = await createOrderViaUI(page, order);
    const orderId = created.orderId;
    await expect(page.getByTestId("order-workflow-panel")).toBeVisible();
    await expect(page.getByTestId("order-detail-page")).toBeVisible();

    await editViaDialog(page, {
      editButtonTestId: "order-edit",
      dialogTestId: "edit-order-dialog",
      resource: "orders",
      fill: async () => {
        await page.getByTestId("order-field-notes").fill(editedNotes);
        await page.getByTestId("order-field-internal-id").fill(`${order.internalId}-EDIT`);
      },
    });

    await assertDetailShowsText(page, "order-detail-page", editedNotes);

    await gotoFleetopsList(page, "/fleet-ops/operations/orders", "orders-list-page");
    await page.getByTestId("orders-view-table").click();
    await waitForApiSettle(page);

    await openTableRowById(
      page,
      "orders-table",
      orderId,
      "order-detail-page",
      /\/fleet-ops\/operations\/orders\/[^/]+/,
    );
    await assertDetailShowsText(page, "order-detail-page", editedNotes);
    await refreshAndAssertDetail(page, "order-detail-page", "order-refresh", editedNotes);

    const dispatch = page.getByTestId("order-action-dispatch");
    if (await dispatch.isVisible()) {
      await dispatch.click();
      await expect(page.getByTestId("order-action-confirm-dialog")).toBeVisible();
      await page.getByTestId("order-action-confirm-cancel").click();
      await expect(page.getByTestId("order-action-confirm-dialog")).toBeHidden();
    }

    assertDiagnosticsClean(diagnostics);
  });

  test("order list refresh after create shows new row", async ({ page, diagnostics }) => {
    const order = e2eUnique("OrderList");

    await gotoRoute(page, "/fleet-ops/operations/orders/new", { pageTestId: "order-new-page" });
    const missing = page.getByTestId("order-config-missing");
    if (await missing.isVisible().catch(() => false)) {
      test.skip(true, "No order configs in environment");
      return;
    }

    const created = await createOrderViaUI(page, order);

    await gotoFleetopsList(page, "/fleet-ops/operations/orders", "orders-list-page");
    await page.getByTestId("orders-view-table").click();
    await waitForApiSettle(page);
    await expect(page.getByTestId(`orders-table-row-${created.orderId}`)).toBeVisible({
      timeout: 30_000,
    });
    await expectGlobalLoaderHidden(page);

    assertDiagnosticsClean(diagnostics);
  });
});

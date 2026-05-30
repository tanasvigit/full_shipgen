import { test, expect } from "../fixtures/test";
import {
  FLEETOPS_FORM_MODAL_MODULES,
  exerciseFleetopsModuleFormModals,
  assertFleetOpsFormModal,
  cancelFleetOpsDialog,
} from "../helpers/fleetops/form-modals";
import { gotoRoute } from "../helpers/navigation";
import { openFleetOpsFormAndCancel } from "../helpers/page";
import { waitForApiSettle } from "../helpers/network";

test.describe.configure({ mode: "serial" });

test.describe("FleetOps — create / view / edit form modals", () => {
  for (const mod of FLEETOPS_FORM_MODAL_MODULES) {
    test(`${mod.name}: create modal opens with form body`, async ({ page }) => {
      await gotoRoute(page, mod.path, { pageTestId: mod.listPageTestId });
      await waitForApiSettle(page);
      if (mod.prepareList) await mod.prepareList(page);

      await openFleetOpsFormAndCancel(page, mod.create.openTestId, {
        dialogTestId: mod.create.dialogTestId,
        formTestId: mod.create.formTestId,
      });
    });

    if (mod.view && mod.edit) {
      test(`${mod.name}: detail drawer view + edit modal (when data exists)`, async ({ page }) => {
        await exerciseFleetopsModuleFormModals(page, mod);
      });
    }
  }

  test("orders: create tolerates missing order config banner", async ({ page }) => {
    await gotoRoute(page, "/fleet-ops/operations/orders", { pageTestId: "orders-list-page" });
    await waitForApiSettle(page);
    await page.getByTestId("orders-view-table").click();
    await page.getByTestId("orders-new-button").click();
    const dialog = page.getByTestId("new-order");
    await assertFleetOpsFormModal(page, "new-order");
    const hasForm = await page.getByTestId("order-form").isVisible().catch(() => false);
    const hasMissing = await page.getByTestId("order-config-missing").isVisible().catch(() => false);
    expect(hasForm || hasMissing).toBeTruthy();
    await cancelFleetOpsDialog(page, "new-order");
  });
});

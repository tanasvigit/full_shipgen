import { test, expect } from "../fixtures/test";
import {
  FLEETOPS_FORM_MODAL_MODULES,
  assertFleetOpsFormModal,
  cancelFleetOpsDialog,
} from "../helpers/fleetops/form-modals";
import { assertAllSelectDropdownsOpen } from "../helpers/fleetops/dropdowns";
import { gotoRoute } from "../helpers/navigation";
import { openFirstDetailFromTable } from "../helpers/page";
import { waitForApiSettle } from "../helpers/network";

test.describe.configure({ mode: "serial" });

test.describe("FleetOps — form select dropdowns open inside modals", () => {
  for (const mod of FLEETOPS_FORM_MODAL_MODULES) {
    test(`${mod.name}: all comboboxes open in create modal`, async ({ page }) => {
      await gotoRoute(page, mod.path, { pageTestId: mod.listPageTestId });
      await waitForApiSettle(page);
      if (mod.prepareList) await mod.prepareList(page);

      await page.getByTestId(mod.create.openTestId).click();
      await assertFleetOpsFormModal(page, mod.create.dialogTestId, mod.create.formTestId);

      const dialog = page.getByTestId(mod.create.dialogTestId);
      const form = page.getByTestId(mod.create.formTestId);

      if (mod.name === "orders" && !(await form.isVisible().catch(() => false))) {
        test.skip();
        return;
      }

      await assertAllSelectDropdownsOpen(page, form, { label: `${mod.name} create` });
      await cancelFleetOpsDialog(page, mod.create.dialogTestId);
    });
  }

  test("orders: assign-driver modal comboboxes open", async ({ page }) => {
    await gotoRoute(page, "/fleet-ops/operations/orders", { pageTestId: "orders-list-page" });
    await waitForApiSettle(page);
    await page.getByTestId("orders-view-table").click();

    const opened = await openFirstDetailFromTable(page, "orders-table", "order-detail-page");
    if (!opened) {
      test.skip();
      return;
    }

    const assignBtn = page.getByTestId("order-assign-driver");
    if (!(await assignBtn.isVisible().catch(() => false))) {
      test.skip();
      return;
    }

    await assignBtn.click();
    const dialog = page.getByTestId("assign-driver-dialog");
    await dialog.waitFor({ state: "visible", timeout: 15_000 });
    await expect(dialog.getByTestId("assign-driver-trigger")).not.toContainText("Loading", {
      timeout: 30_000,
    });

    await assertAllSelectDropdownsOpen(page, dialog, { label: "assign-driver" });
    await dialog.getByRole("button", { name: /cancel/i }).click();
    await dialog.waitFor({ state: "hidden", timeout: 10_000 });
  });
});

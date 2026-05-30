import { test, expect } from "../../fixtures/test";
import { e2eUnique } from "../../helpers/fleetops/test-data";
import {
  createDriverViaUI,
  fillDriverForm,
  editViaDialog,
  openDriverDetailFromTable,
} from "../../helpers/fleetops/create-entity";
import {
  assertDiagnosticsClean,
  assertDetailShowsText,
  assertRecordInTable,
  refreshAndAssertDetail,
} from "../../helpers/fleetops/assertions";
import { gotoFleetopsList } from "../../helpers/fleetops/workflow";

test.describe("FleetOps CRUD — Drivers", () => {
  test("onboard → table → detail → edit license → persist", async ({ page, diagnostics }) => {
    const seed = e2eUnique("Driver");
    const editedName = `${seed.name} Updated`;
    const editedLicense = `LIC-EDIT-${seed.slug}`;

    await createDriverViaUI(page, seed);
    await openDriverDetailFromTable(page, seed.name);

    await editViaDialog(page, {
      editButtonTestId: "driver-edit",
      dialogTestId: "edit-driver-dialog",
      resource: "drivers",
      fill: async () => {
        await fillDriverForm(page, seed, { editedName });
        await page.getByTestId("driver-field-license").fill(editedLicense);
      },
    });

    await assertDetailShowsText(page, "driver-detail-page", editedName);

    await gotoFleetopsList(page, "/fleet-ops/management/drivers", "drivers-list-page");
    await assertRecordInTable(page, "drivers-table", editedName);

    await openDriverDetailFromTable(page, editedName);
    await refreshAndAssertDetail(page, "driver-detail-page", null, editedName);

    assertDiagnosticsClean(diagnostics);
  });
});

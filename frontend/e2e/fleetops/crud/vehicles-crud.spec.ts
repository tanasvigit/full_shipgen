import { test, expect } from "../../fixtures/test";
import { e2eUnique } from "../../helpers/fleetops/test-data";
import {
  createVehicleViaUI,
  fillVehicleForm,
  editViaDialog,
} from "../../helpers/fleetops/create-entity";
import {
  assertDiagnosticsClean,
  assertDetailShowsText,
  assertRecordInTable,
  refreshAndAssertDetail,
} from "../../helpers/fleetops/assertions";
import { gotoFleetopsList } from "../../helpers/fleetops/workflow";
import { openTableRowByText } from "../../helpers/page";

test.describe("FleetOps CRUD — Vehicles", () => {
  test("register → table → detail → edit → persist", async ({ page, diagnostics }) => {
    const seed = e2eUnique("Vehicle");
    const editedName = `${seed.name} Updated`;
    const editedPlate = `${seed.plate}X`;

    await createVehicleViaUI(page, seed);

    await openTableRowByText(
      page,
      "vehicles-table",
      seed.plate,
      "vehicle-detail-page",
      /\/fleet-ops\/management\/vehicles\/[^/]+/,
    );

    await editViaDialog(page, {
      editButtonTestId: "vehicle-edit",
      dialogTestId: "edit-vehicle-dialog",
      resource: "vehicles",
      fill: async () => {
        await fillVehicleForm(page, seed, { editedName });
        await page.getByTestId("vehicle-field-plate").fill(editedPlate);
      },
    });

    await assertDetailShowsText(page, "vehicle-detail-page", editedName);

    await gotoFleetopsList(page, "/fleet-ops/management/vehicles", "vehicles-list-page");
    await assertRecordInTable(page, "vehicles-table", editedPlate);

    await openTableRowByText(
      page,
      "vehicles-table",
      editedPlate,
      "vehicle-detail-page",
      /\/fleet-ops\/management\/vehicles\/[^/]+/,
    );
    await refreshAndAssertDetail(page, "vehicle-detail-page", null, editedName);

    assertDiagnosticsClean(diagnostics);
  });
});

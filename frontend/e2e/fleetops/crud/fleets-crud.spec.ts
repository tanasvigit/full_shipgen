import { test, expect } from "../../fixtures/test";
import { e2eUnique } from "../../helpers/fleetops/test-data";
import {
  createFleetViaUI,
  fillFleetForm,
  editViaDialog,
  openFleetCard,
} from "../../helpers/fleetops/create-entity";
import {
  assertDiagnosticsClean,
  assertDetailShowsText,
  refreshAndAssertDetail,
} from "../../helpers/fleetops/assertions";
import { gotoFleetopsList } from "../../helpers/fleetops/workflow";

test.describe("FleetOps CRUD — Fleets", () => {
  test("create card → detail → edit metadata → persist", async ({ page, diagnostics }) => {
    const seed = e2eUnique("Fleet");
    const editedName = `${seed.name} Updated`;

    await createFleetViaUI(page, seed);
    await openFleetCard(page, seed.name);

    await editViaDialog(page, {
      editButtonTestId: "fleet-edit",
      dialogTestId: "edit-fleet-dialog",
      resource: "fleets",
      fill: async () => {
        await fillFleetForm(page, seed, { editedName });
        await page.getByTestId("fleet-field-description").fill(`Updated ${seed.notes}`);
      },
    });

    await assertDetailShowsText(page, "fleet-detail-page", editedName);

    await gotoFleetopsList(page, "/fleet-ops/management/fleets", "fleets-list-page");
    await expect(page.getByText(editedName).first()).toBeVisible({ timeout: 20_000 });

    await openFleetCard(page, editedName);
    await refreshAndAssertDetail(page, "fleet-detail-page", null, editedName);

    assertDiagnosticsClean(diagnostics);
  });
});

import { test, expect } from "../../fixtures/test";
import { e2eUnique } from "../../helpers/fleetops/test-data";
import {
  createPlaceViaUI,
  fillPlaceForm,
  editViaDialog,
} from "../../helpers/fleetops/create-entity";
import {
  assertDiagnosticsClean,
  assertDetailShowsText,
  refreshAndAssertDetail,
} from "../../helpers/fleetops/assertions";
import { gotoFleetopsList } from "../../helpers/fleetops/workflow";
import { openTableRowByText } from "../../helpers/page";

test.describe("FleetOps CRUD — Places", () => {
  test("create → table → detail → edit → persist after refresh", async ({ page, diagnostics }) => {
    const seed = e2eUnique("Place");
    const editedName = `${seed.name} Updated`;

    await createPlaceViaUI(page, seed);

    await openTableRowByText(
      page,
      "places-table",
      seed.name,
      "place-detail-page",
      /\/fleet-ops\/management\/places\/[^/]+/,
    );

    await editViaDialog(page, {
      editButtonTestId: "place-edit",
      dialogTestId: "edit-place-dialog",
      resource: "places",
      fill: async () => fillPlaceForm(page, seed, { editedName }),
    });

    await assertDetailShowsText(page, "place-detail-page", editedName);

    await gotoFleetopsList(page, "/fleet-ops/management/places", "places-list-page");
    await page.getByTestId("places-table-search").fill(editedName);
    await expect(page.locator("[data-testid^='places-table-row-']").filter({ hasText: editedName }).first()).toBeVisible();

    await openTableRowByText(
      page,
      "places-table",
      editedName,
      "place-detail-page",
      /\/fleet-ops\/management\/places\/[^/]+/,
    );
    await refreshAndAssertDetail(page, "place-detail-page", null, editedName);

    assertDiagnosticsClean(diagnostics);
  });
});

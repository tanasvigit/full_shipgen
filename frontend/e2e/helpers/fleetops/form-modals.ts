import { expect, type Page } from "@playwright/test";
import { gotoRoute } from "../navigation";
import { openFleetOpsFormAndCancel, openFirstDetailFromTable } from "../page";
import { waitForApiSettle } from "../network";
import { assertSingleDialogSurface } from "./scenario-health";

export type FleetopsFormModalModule = {
  name: string;
  path: string;
  listPageTestId: string;
  /** Run before opening list interactions (e.g. orders table view). */
  prepareList?: (page: Page) => Promise<void>;
  create: {
    openTestId: string;
    dialogTestId: string;
    formTestId: string;
  };
  view?: {
    kind: "table" | "card";
    tableTestId?: string;
    cardSelector?: string;
    detailPageTestId: string;
    drawerTestId: string;
    urlParam: string;
  };
  edit?: {
    editButtonTestId: string;
    dialogTestId: string;
    formTestId: string;
  };
};

export const FLEETOPS_FORM_MODAL_MODULES: FleetopsFormModalModule[] = [
  {
    name: "drivers",
    path: "/fleet-ops/management/drivers",
    listPageTestId: "drivers-list-page",
    create: {
      openTestId: "drivers-new-button",
      dialogTestId: "onboard-driver-dialog",
      formTestId: "driver-form",
    },
    view: {
      kind: "table",
      tableTestId: "drivers-table",
      detailPageTestId: "driver-detail-page",
      drawerTestId: "driver-detail-drawer",
      urlParam: "driver",
    },
    edit: {
      editButtonTestId: "driver-edit",
      dialogTestId: "edit-driver-dialog",
      formTestId: "driver-form",
    },
  },
  {
    name: "vehicles",
    path: "/fleet-ops/management/vehicles",
    listPageTestId: "vehicles-list-page",
    create: {
      openTestId: "vehicles-new-button",
      dialogTestId: "register-vehicle-dialog",
      formTestId: "vehicle-form",
    },
    view: {
      kind: "table",
      tableTestId: "vehicles-table",
      detailPageTestId: "vehicle-detail-page",
      drawerTestId: "vehicle-detail-drawer",
      urlParam: "vehicle",
    },
    edit: {
      editButtonTestId: "vehicle-edit",
      dialogTestId: "edit-vehicle-dialog",
      formTestId: "vehicle-form",
    },
  },
  {
    name: "places",
    path: "/fleet-ops/management/places",
    listPageTestId: "places-list-page",
    create: {
      openTestId: "places-new-button",
      dialogTestId: "add-place-dialog",
      formTestId: "place-form",
    },
    view: {
      kind: "table",
      tableTestId: "places-table",
      detailPageTestId: "place-detail-page",
      drawerTestId: "place-detail-drawer",
      urlParam: "place",
    },
    edit: {
      editButtonTestId: "place-edit",
      dialogTestId: "edit-place-dialog",
      formTestId: "place-form",
    },
  },
  {
    name: "fleets",
    path: "/fleet-ops/management/fleets",
    listPageTestId: "fleets-list-page",
    create: {
      openTestId: "fleets-new-button",
      dialogTestId: "create-fleet-dialog",
      formTestId: "fleet-form",
    },
    view: {
      kind: "card",
      cardSelector: '[data-testid^="fleet-card-"]',
      detailPageTestId: "fleet-detail-page",
      drawerTestId: "fleet-detail-drawer",
      urlParam: "fleet",
    },
    edit: {
      editButtonTestId: "fleet-edit",
      dialogTestId: "edit-fleet-dialog",
      formTestId: "fleet-form",
    },
  },
  {
    name: "orders",
    path: "/fleet-ops/operations/orders",
    listPageTestId: "orders-list-page",
    prepareList: async (page) => {
      await page.getByTestId("orders-view-table").click();
    },
    create: {
      openTestId: "orders-new-button",
      dialogTestId: "new-order",
      formTestId: "order-form",
    },
    view: {
      kind: "table",
      tableTestId: "orders-table",
      detailPageTestId: "order-detail-page",
      drawerTestId: "order-detail-drawer",
      urlParam: "order",
    },
    edit: {
      editButtonTestId: "order-edit",
      dialogTestId: "edit-order-dialog",
      formTestId: "order-form",
    },
  },
  {
    name: "schedule",
    path: "/fleet-ops/operations/schedule",
    listPageTestId: "schedule-planner-page",
    create: {
      openTestId: "schedule-new",
      dialogTestId: "add-shift-dialog",
      formTestId: "shift-form",
    },
  },
];

/** Assert FleetOps modal is visible with non-collapsed body and a single dialog surface. */
export async function assertFleetOpsFormModal(
  page: Page,
  dialogTestId: string,
  formTestId?: string,
) {
  const dialog = page.getByTestId(dialogTestId);
  await expect(dialog).toBeVisible({ timeout: 15_000 });
  const box = await dialog.boundingBox();
  expect(box).not.toBeNull();
  expect(box!.height).toBeGreaterThan(120);
  if (formTestId) {
    await expect(page.getByTestId(formTestId)).toBeVisible();
    await expect(
      dialog.locator("input, select, textarea, button[type='submit']").first(),
    ).toBeVisible();
  }
  await assertSingleDialogSurface(page);
}

export async function cancelFleetOpsDialog(page: Page, dialogTestId: string) {
  const dialog = page.getByTestId(dialogTestId);
  await dialog.getByRole("button", { name: /cancel/i }).click();
  await expect(dialog).toBeHidden({ timeout: 15_000 });
}

export async function openFleetopsDetail(
  page: Page,
  view: NonNullable<FleetopsFormModalModule["view"]>,
): Promise<boolean> {
  if (view.kind === "table" && view.tableTestId) {
    return openFirstDetailFromTable(page, view.tableTestId, view.detailPageTestId);
  }
  if (view.kind === "card" && view.cardSelector) {
    const card = page.locator(view.cardSelector).first();
    if (!(await card.isVisible())) return false;
    await card.click();
    await expect(page.getByTestId(view.detailPageTestId)).toBeVisible({ timeout: 20_000 });
    return true;
  }
  return false;
}

export async function exerciseFleetopsModuleFormModals(page: Page, mod: FleetopsFormModalModule) {
  await gotoRoute(page, mod.path, { pageTestId: mod.listPageTestId });
  await waitForApiSettle(page);
  if (mod.prepareList) await mod.prepareList(page);

  await page.getByTestId(mod.create.openTestId).click();
  await assertFleetOpsFormModal(page, mod.create.dialogTestId, mod.create.formTestId);
  await cancelFleetOpsDialog(page, mod.create.dialogTestId);
  await expect(page.getByTestId(mod.listPageTestId)).toBeVisible();

  if (!mod.view) return;

  const opened = await openFleetopsDetail(page, mod.view);
  if (!opened) return;

  await expect(page.getByTestId(mod.view.drawerTestId)).toBeVisible();
  await expect(page).toHaveURL(new RegExp(`[?&]${mod.view.urlParam}=`));

  if (!mod.edit) return;

  const editBtn = page.getByTestId(mod.edit.editButtonTestId);
  if (!(await editBtn.isVisible().catch(() => false))) return;

  const paramValue = new URL(page.url()).searchParams.get(mod.view.urlParam);
  await editBtn.click();

  await expect(page).toHaveURL(new RegExp(`[?&]${mod.view.urlParam}=${paramValue}`));
  await expect(page.getByTestId(mod.view.drawerTestId)).toBeVisible();
  await assertFleetOpsFormModal(page, mod.edit.dialogTestId, mod.edit.formTestId);
  await cancelFleetOpsDialog(page, mod.edit.dialogTestId);
  await expect(page.getByTestId(mod.view.detailPageTestId)).toBeVisible();
  await expect(page.getByTestId(mod.view.drawerTestId)).toBeVisible();
}

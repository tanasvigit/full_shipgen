import { test, expect } from "../fixtures/test";
import { gotoRoute, expectPageRoot } from "../helpers/navigation";
import { waitForApiSettle } from "../helpers/network";
import { openFirstDetailFromTable } from "../helpers/page";

test.describe("FleetOps — order workflow depth", () => {
  test.beforeEach(async ({ page }) => {
    await gotoRoute(page, "/fleet-ops/operations/orders", { pageTestId: "orders-list-page" });
    await waitForApiSettle(page);
  });

  test("order detail — tabs, workflow panel, activity timeline", async ({ page }) => {
    const opened = await openFirstDetailFromTable(page, "orders-table", "order-detail-page");
    if (!opened) {
      test.skip();
      return;
    }

    await expect(page.getByTestId("global-loader")).toBeHidden({ timeout: 20_000 });
    await expect(page.getByTestId("order-workflow-panel")).toBeVisible();
    await page.getByTestId("order-tab-activity").click();
    await expect(page.getByTestId("activity-timeline").or(page.getByTestId("activity-timeline-empty"))).toBeVisible();
    await page.getByTestId("order-tab-documents").click();
    await expect(page.getByTestId("order-file-uploader").or(page.getByTestId("order-files-list"))).toBeVisible();
    await page.getByTestId("order-tab-overview").click();
    await expect(page.getByTestId("order-map")).toBeVisible();
  });

  test("order edit dialog opens and cancels", async ({ page }) => {
    const opened = await openFirstDetailFromTable(page, "orders-table", "order-detail-page");
    if (!opened) {
      test.skip();
      return;
    }

    const edit = page.getByTestId("order-edit");
    if (!(await edit.isVisible())) {
      test.skip();
      return;
    }

    await edit.click();
    await expect(page.getByTestId("edit-order-dialog")).toBeVisible();
    await expect(page.getByTestId("order-form")).toBeVisible();
    await page.getByRole("button", { name: /^cancel$/i }).first().click();
    await expect(page.getByTestId("edit-order-dialog")).toBeHidden();
  });

  test("dispatch confirm dialog when action visible", async ({ page }) => {
    const opened = await openFirstDetailFromTable(page, "orders-table", "order-detail-page");
    if (!opened) {
      test.skip();
      return;
    }

    const dispatch = page.getByTestId("order-action-dispatch");
    if (!(await dispatch.isVisible())) {
      test.skip();
      return;
    }

    await dispatch.click();
    await expect(page.getByTestId("order-action-confirm-dialog")).toBeVisible();
    await page.getByTestId("order-action-confirm-cancel").click();
    await expect(page.getByTestId("order-action-confirm-dialog")).toBeHidden();
  });
});

test.describe("FleetOps — schedule conflicts", () => {
  test("add shift dialog shows backend note", async ({ page }) => {
    await gotoRoute(page, "/fleet-ops/operations/schedule", { pageTestId: "schedule-planner-page" });
    await page.getByTestId("schedule-new").click();
    await expect(page.getByTestId("add-shift-dialog")).toBeVisible();
    await expect(page.getByTestId("schedule-backend-note")).toBeVisible();
    await page.getByRole("button", { name: /cancel/i }).first().click();
  });
});

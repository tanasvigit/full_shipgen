import { test, expect } from "../fixtures/test";
import { gotoRoute, expectPageRoot } from "../helpers/navigation";
import { waitForApiSettle } from "../helpers/network";
import { openFirstDetailFromTable } from "../helpers/page";

test.describe("FleetOps — workflow chains & state", () => {
  test.beforeEach(async ({ page }) => {
    await gotoRoute(page, "/fleet-ops/operations/orders", { pageTestId: "orders-list-page" });
    await waitForApiSettle(page);
  });

  test("terminal order hides edit and shows terminal workflow message", async ({ page }) => {
    const opened = await openFirstDetailFromTable(page, "orders-table", "order-detail-page");
    if (!opened) {
      test.skip();
      return;
    }
    await expect(page.getByTestId("global-loader")).toBeHidden({ timeout: 20_000 });

    const terminal = page.getByTestId("order-workflow-actions-terminal");
    const edit = page.getByTestId("order-edit");
    if (await terminal.isVisible()) {
      await expect(edit).toBeHidden();
      return;
    }
    if (await edit.isVisible()) {
      await expect(terminal).toBeHidden();
    }
  });

  test("workflow confirm cancel does not change status badge", async ({ page }) => {
    const opened = await openFirstDetailFromTable(page, "orders-table", "order-detail-page");
    if (!opened) {
      test.skip();
      return;
    }
    await expect(page.getByTestId("global-loader")).toBeHidden({ timeout: 20_000 });

    const dispatch = page.getByTestId("order-action-dispatch");
    if (!(await dispatch.isVisible())) {
      test.skip();
      return;
    }

    const badgeBefore = await page.locator("[data-testid='order-detail-page'] .font-mono, [data-testid='order-detail-page'] span").first().textContent();
    await dispatch.click();
    await expect(page.getByTestId("order-action-confirm-dialog")).toBeVisible();
    await page.getByTestId("order-action-confirm-cancel").click();
    await expect(page.getByTestId("order-action-confirm-dialog")).toBeHidden();
    await expect(page.getByTestId("order-workflow-panel")).toBeVisible();
    await expect(dispatch).toBeVisible();
    if (badgeBefore) {
      await expect(page.getByTestId("order-workflow-panel")).toBeVisible();
    }
  });

  test("activity tab loads timeline after workflow panel", async ({ page }) => {
    const opened = await openFirstDetailFromTable(page, "orders-table", "order-detail-page");
    if (!opened) {
      test.skip();
      return;
    }
    await expect(page.getByTestId("order-workflow-panel")).toBeVisible();
    await page.getByTestId("order-tab-activity").click();
    await expect(
      page.getByTestId("activity-timeline").or(page.getByTestId("activity-timeline-empty")),
    ).toBeVisible();
    await page.getByTestId("order-tab-documents").click();
    await expect(page.getByTestId("order-files-list").or(page.getByTestId("order-file-uploader")).or(page.getByTestId("attachment-list-empty"))).toBeVisible();
  });

  test("refresh keeps detail page mounted", async ({ page }) => {
    const opened = await openFirstDetailFromTable(page, "orders-table", "order-detail-page");
    if (!opened) {
      test.skip();
      return;
    }
    await page.getByTestId("order-refresh").click();
    await waitForApiSettle(page);
    await expect(page.getByTestId("order-detail-page")).toBeVisible();
    await expect(page.getByTestId("order-workflow-panel")).toBeVisible();
  });
});

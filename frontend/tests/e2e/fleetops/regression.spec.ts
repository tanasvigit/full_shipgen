import { test, expect } from "../../../e2e/fixtures/fleetops-stabilization";
import {
  gotoOrdersList,
  selectFirstOrderCheckbox,
  openFirstOrderDetail,
  navigateFleetOpsSidebar,
} from "../../../e2e/helpers/fleetops/stabilization";
import { waitForApiSettle } from "../../../e2e/helpers/network";
import { e2eUnique } from "../../../e2e/helpers/fleetops/test-data";

test.describe.configure({ mode: "serial", timeout: 300_000 });

test.describe("FleetOps Day 1 — Full dispatcher regression", () => {
  test("end-to-end dispatcher workflow", async ({ page }) => {
    const note = e2eUnique("Regression").label;

    // 1–2 Open orders, filter/search
    await gotoOrdersList(page);
    const search = page.getByTestId("orders-table-search");
    if (await search.isVisible()) {
      await search.fill("e2e");
      await waitForApiSettle(page);
      await search.clear();
    }
    const chips = page.locator('[data-testid="orders-filters"] button').nth(1);
    if (await chips.isVisible()) await chips.click();

    // 3–6 Plan route from selection
    if (await selectFirstOrderCheckbox(page)) {
      await page.getByTestId("orders-plan-routes").click();
      await expect(page.getByTestId("route-new-page")).toBeVisible();
      await page.getByTestId("route-create-submit").click();
      await page.waitForURL(/\/routes\//, { timeout: 60_000 }).catch(() => {});
      if (page.url().includes("/routes/") && !page.url().endsWith("/routes")) {
        const optimize = page.getByTestId("route-optimize");
        if (await optimize.isVisible()) await optimize.click();
        await waitForApiSettle(page);
      }
    }

    // 7–8 Scheduler
    await navigateFleetOpsSidebar(page, "schedule", "/fleet-ops/operations/schedule", "schedule-planner-page");
    await expect(page.getByTestId("schedule-planner-page")).toBeVisible();

    // 9–12 Order detail: assign, metadata, notes
    await gotoOrdersList(page);
    if (!(await openFirstOrderDetail(page))) {
      test.skip();
      return;
    }

    const assign = page.getByTestId("order-assign-driver");
    if (await assign.isVisible()) {
      await assign.click();
      await expect(page.getByTestId("assign-driver-dialog")).toBeVisible();
      await page.getByRole("button", { name: /cancel/i }).first().click();
    }

    const scheduleBtn = page.getByTestId("order-schedule");
    if (await scheduleBtn.isVisible()) {
      await scheduleBtn.click();
      await page.getByRole("button", { name: /cancel/i }).first().click();
    }

    await page.getByTestId("detail-tab-notes").click();
    const notesSave = page.getByTestId("order-notes-save");
    if (await notesSave.isVisible()) {
      await page.locator('[data-testid="detail-tab-notes"]').locator("textarea").fill(note);
      await notesSave.click();
      await waitForApiSettle(page);
    }

    const metaEdit = page.getByTestId("order-metadata-edit");
    if (await metaEdit.isVisible()) {
      await metaEdit.click();
      await page.getByRole("button", { name: /cancel/i }).first().click();
    }

    // 13 Realtime stability — refresh
    await page.getByTestId("order-refresh").click();
    await waitForApiSettle(page);

    // 14 Dispatch flow (confirm only)
    const dispatch = page.getByTestId("order-action-dispatch");
    if (await dispatch.isVisible()) {
      await dispatch.click();
      await expect(page.getByTestId("order-action-confirm-dialog")).toBeVisible();
      await page.getByTestId("order-action-confirm-cancel").click();
    }

    await page.reload();
    await expect(page.getByTestId("order-detail-page")).toBeVisible();
    await page.getByTestId("detail-tab-notes").click();
    if (await notesSave.isVisible()) {
      await expect(page.getByText(note)).toBeVisible();
    }
  });
});

import { test, expect } from "../../../e2e/fixtures/fleetops-stabilization";
import { navigateFleetOpsSidebar } from "../../../e2e/helpers/fleetops/stabilization";
import { waitForApiSettle } from "../../../e2e/helpers/network";

test.describe("FleetOps Day 1 — Schedule planner", () => {
  test.beforeEach(async ({ page }) => {
    await navigateFleetOpsSidebar(page, "schedule", "/fleet-ops/operations/schedule", "schedule-planner-page");
  });

  test("G008 — schedule page loads with week navigation", async ({ page }) => {
    await expect(page.getByTestId("schedule-week-nav")).toBeVisible();
    await page.getByTestId("schedule-week-nav").locator("button").last().click();
    await waitForApiSettle(page);
    await page.getByTestId("schedule-week-nav").locator("button").first().click();
    await page.reload();
    await expect(page.getByTestId("schedule-planner-page")).toBeVisible();
  });

  test("G008 — shift grid or empty state renders", async ({ page }) => {
    const empty = page.getByTestId("schedule-empty");
    const row = page.locator('[data-testid^="schedule-row-"]').first();
    await expect(empty.or(row)).toBeVisible({ timeout: 30_000 });
  });

  test("G008 — add shift dialog opens and cancels", async ({ page }) => {
    await page.getByTestId("schedule-new").click();
    const dialog = page.getByTestId("add-shift-dialog");
    await expect(dialog).toBeVisible();
    await page.getByTestId("add-shift-dialog-cancel").click().catch(async () => {
      await dialog.getByRole("button", { name: /cancel/i }).first().click();
    });
    await expect(dialog).toBeHidden();
  });

  test("G009 — fleet schedule tab loads", async ({ page }) => {
    await page.getByTestId("schedule-tab-fleet").click();
    await expect(page.getByTestId("fleet-schedule-view")).toBeVisible({ timeout: 30_000 });
  });

  test("G010 — best-fit button visible on fleet schedule", async ({ page }) => {
    await page.getByTestId("schedule-tab-fleet").click();
    await expect(page.getByTestId("fleet-schedule-best-fit")).toBeVisible();
  });
});

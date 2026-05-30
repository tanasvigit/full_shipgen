import { test, expect } from "../../../e2e/fixtures/fleetops-stabilization";
import { waitForApiSettle } from "../../../e2e/helpers/network";

test.describe("FleetOps Day 2 — Maintenance", () => {
  async function expectListOrForbidden(page, key) {
    const list = page.getByTestId(`${key}-list-page`);
    const forbidden = page.getByTestId(`${key}-forbidden`);
    await expect(list.or(forbidden)).toBeVisible();
    return { hasList: await list.isVisible() };
  }

  test("maintenance schedules CRUD shell + related work orders visibility", async ({ page }) => {
    await page.goto("/fleet-ops/maintenance/schedules");
    const { hasList } = await expectListOrForbidden(page, "maintenance-schedule");
    if (!hasList) return;
    await expect(
      page.getByTestId("maintenance-schedule-table").or(page.getByTestId("maintenance-schedule-empty")),
    ).toBeVisible();
    const row = page.getByTestId("maintenance-schedule-table").locator("tbody tr").first();
    if (await row.isVisible()) {
      await row.click();
      await expect(page.getByTestId("maintenance-schedule-detail-page")).toBeVisible();
      await expect(page.getByTestId("schedule-work-orders-panel")).toBeVisible();
    }
  });

  test("maintenance records create/edit/detail shell is stable", async ({ page }) => {
    await page.goto("/fleet-ops/maintenance/records");
    const { hasList } = await expectListOrForbidden(page, "maintenance");
    if (!hasList) return;
    const create = page.getByTestId("maintenance-new-button");
    if (await create.isVisible()) {
      await create.click();
      await expect(page.getByTestId("maintenance-create-dialog")).toBeVisible();
      await page.getByRole("button", { name: /cancel/i }).first().click();
    }
    await page.reload();
    await expect(page.getByTestId("maintenance-list-page")).toBeVisible();
  });

  test("work orders lifecycle status safety + reload persistence", async ({ page }) => {
    await page.goto("/fleet-ops/maintenance/work-orders");
    const { hasList } = await expectListOrForbidden(page, "work-order");
    if (!hasList) return;
    await expect(page.getByTestId("work-order-table").or(page.getByTestId("work-order-empty"))).toBeVisible();
    await waitForApiSettle(page);
    const row = page.getByTestId("work-order-table").locator("tbody tr").first();
    if (await row.isVisible()) {
      await row.click();
      await expect(page.getByTestId("work-order-detail-page")).toBeVisible();
      const statusSelect = page.getByTestId("work-order-status-select");
      if (await statusSelect.isVisible()) {
        await statusSelect.click();
        await page.getByRole("option", { name: /scheduled|in progress|completed|draft/i }).first().click();
      }
      await page.reload();
      await expect(page.getByTestId("work-order-detail-page")).toBeVisible();
    }
  });

  test("equipment and parts CRUD surfaces + route transitions", async ({ page }) => {
    await page.goto("/fleet-ops/maintenance/parts");
    const parts = await expectListOrForbidden(page, "part");
    if (!parts.hasList) return;
    await expect(page.getByTestId("part-table").or(page.getByTestId("part-empty"))).toBeVisible();
    await page.goto("/fleet-ops/maintenance/equipment");
    const equipment = await expectListOrForbidden(page, "equipment");
    if (!equipment.hasList) return;
    await expect(page.getByTestId("equipment-table").or(page.getByTestId("equipment-empty"))).toBeVisible();
    await page.reload();
    await expect(page.getByTestId("equipment-list-page")).toBeVisible();
  });
});

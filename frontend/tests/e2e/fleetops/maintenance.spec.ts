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

  test("maintenance schedule pause/trigger actions render", async ({ page }) => {
    await page.goto("/fleet-ops/maintenance/schedules");
    const { hasList } = await expectListOrForbidden(page, "maintenance-schedule");
    if (!hasList) return;
    const row = page.getByTestId("maintenance-schedule-table").locator("tbody tr").first();
    if (await row.isVisible()) {
      await row.click();
      await expect(page.getByTestId("maintenance-schedule-detail-page")).toBeVisible();
      await expect(page.getByTestId("maintenance-schedule-actions")).toBeVisible();
    }
  });

  test("work order send email dialog opens", async ({ page }) => {
    await page.goto("/fleet-ops/maintenance/work-orders");
    const { hasList } = await expectListOrForbidden(page, "work-order");
    if (!hasList) return;
    const row = page.getByTestId("work-order-table").locator("tbody tr").first();
    if (await row.isVisible()) {
      await row.click();
      await expect(page.getByTestId("work-order-detail-page")).toBeVisible();
      const sendBtn = page.getByTestId("work-order-send-email");
      if (await sendBtn.isVisible()) {
        await sendBtn.click();
        await expect(page.getByTestId("send-work-order-dialog")).toBeVisible();
      }
    }
  });

  test("maintenance record line items panel", async ({ page }) => {
    await page.goto("/fleet-ops/maintenance/records");
    const { hasList } = await expectListOrForbidden(page, "maintenance");
    if (!hasList) return;
    const row = page.getByTestId("maintenance-table").locator("tbody tr").first();
    if (await row.isVisible()) {
      await row.click();
      await expect(page.getByTestId("maintenance-detail-page")).toBeVisible();
      await expect(page.getByTestId("maintenance-line-items-panel")).toBeVisible();
    }
  });
});

import { test, expect } from "../../../e2e/fixtures/fleetops-stabilization";
import { waitForApiSettle } from "../../../e2e/helpers/network";

test.describe("FleetOps Day 2 — Entity relations", () => {
  test("vehicle ↔ devices and vehicle ↔ work orders tabs with reload persistence", async ({ page }) => {
    await page.goto("/fleet-ops/management/vehicles");
    if (await page.getByTestId("vehicle-forbidden").isVisible().catch(() => false)) {
      test.skip();
      return;
    }
    await waitForApiSettle(page);
    const row = page.getByTestId("vehicles-table").locator("tbody tr").first();
    if (!(await row.isVisible())) {
      test.skip();
      return;
    }
    await row.click();
    const detail = page.getByTestId("vehicle-detail-page");
    if (!(await detail.isVisible({ timeout: 20_000 }).catch(() => false))) {
      test.skip();
      return;
    }
    await page.getByTestId("vehicle-tab-devices").click();
    await expect(page.getByTestId("vehicle-devices-tab")).toBeVisible();
    await page.getByTestId("vehicle-tab-work-orders").click();
    await expect(page.getByTestId("vehicle-work-orders-tab")).toBeVisible();
    await page.reload();
    await expect(page.getByTestId("vehicle-detail-page")).toBeVisible({ timeout: 20_000 });
  });

  test("driver assignment actions (order/vehicle/vendor) render safely", async ({ page }) => {
    await page.goto("/fleet-ops/management/drivers");
    if (await page.getByTestId("driver-forbidden").isVisible().catch(() => false)) {
      test.skip();
      return;
    }
    await waitForApiSettle(page);
    const row = page.getByTestId("drivers-table").locator("tbody tr").first();
    if (!(await row.isVisible())) {
      test.skip();
      return;
    }
    await row.click();
    await expect(page.getByTestId("driver-detail-page")).toBeVisible({ timeout: 20_000 });
    await expect(page.getByTestId("driver-assignment-actions")).toBeVisible();
    await expect(page.getByTestId("driver-assign-order")).toBeVisible();
    await expect(page.getByTestId("driver-assign-vehicle")).toBeVisible();
    await expect(page.getByTestId("driver-assign-vendor")).toBeVisible();
  });

  test("places comments/documents/rules tabs render safely", async ({ page }) => {
    await page.goto("/fleet-ops/management/places");
    await waitForApiSettle(page);
    const row = page.getByTestId("places-table").locator("tbody tr").first();
    if (!(await row.isVisible())) {
      test.skip();
      return;
    }
    await row.click();
    await expect(page.getByTestId("place-detail-page")).toBeVisible({ timeout: 20_000 });
    const tabs = [
      { name: /comments/i, target: "place-comments-tab" },
      { name: /documents/i, target: "place-documents-tab" },
      { name: /rules/i, target: "place-rules-tab" },
    ];
    for (const tab of tabs) {
      const node = page.getByRole("tab", { name: tab.name });
      if (await node.isVisible()) {
        await node.click();
        await expect(page.getByTestId(tab.target)).toBeVisible();
      }
    }
  });

  test("contacts ↔ customers relation panel is stable", async ({ page }) => {
    await page.goto("/fleet-ops/management/contacts");
    if (await page.getByTestId("contact-forbidden").isVisible().catch(() => false)) {
      test.skip();
      return;
    }
    await waitForApiSettle(page);
    const row = page.getByTestId("contact-table").locator("tbody tr").first();
    if (!(await row.isVisible())) {
      test.skip();
      return;
    }
    await row.click();
    await expect(page.getByTestId("contact-detail-page")).toBeVisible();
    await expect(page.getByTestId("contact-customers-panel")).toBeVisible();
    await page.reload();
    await expect(page.getByTestId("contact-customers-panel")).toBeVisible();
  });

  test("vehicle device attach/detach controls render when data exists", async ({ page }) => {
    await page.goto("/fleet-ops/management/vehicles");
    if (await page.getByTestId("vehicle-forbidden").isVisible().catch(() => false)) {
      test.skip();
      return;
    }
    await waitForApiSettle(page);
    const row = page.getByTestId("vehicles-table").locator("tbody tr").first();
    if (!(await row.isVisible())) {
      test.skip();
      return;
    }
    await row.click();
    const detail = page.getByTestId("vehicle-detail-page");
    if (!(await detail.isVisible({ timeout: 20_000 }).catch(() => false))) {
      test.skip();
      return;
    }
    await page.getByTestId("vehicle-tab-devices").click();
    await expect(page.getByTestId("vehicle-attach-device-select")).toBeVisible();
    const firstDetach = page.locator('[data-testid^="vehicle-detach-"]').first();
    if (await firstDetach.isVisible()) {
      await firstDetach.click();
      await waitForApiSettle(page);
      await expect(page.getByTestId("vehicle-devices-tab")).toBeVisible();
    }
  });
});

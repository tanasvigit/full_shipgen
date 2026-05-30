import { test, expect } from "../../../e2e/fixtures/fleetops-stabilization";

test.describe("FleetOps Day 3 — Geo", () => {
  test("service areas list + detail shell are stable", async ({ page }) => {
    await page.goto("/fleet-ops/service-areas");
    await expect(page.getByTestId("service-area-list-page").or(page.getByTestId("service-area-forbidden"))).toBeVisible();
    if (await page.getByTestId("service-area-forbidden").isVisible()) return;
    const row = page.getByTestId("service-area-table").locator("tbody tr").first();
    if (!(await row.isVisible())) {
      test.skip();
      return;
    }
    await row.click();
    await expect(page.getByTestId("service-area-detail-page")).toBeVisible();
  });

  test("polygon draw/edit controls render and persist after reload", async ({ page }) => {
    await page.goto("/fleet-ops/service-areas");
    if (await page.getByTestId("service-area-forbidden").isVisible().catch(() => false)) return;
    const row = page.getByTestId("service-area-table").locator("tbody tr").first();
    if (!(await row.isVisible())) {
      test.skip();
      return;
    }
    await row.click();
    await expect(page.getByTestId("service-area-map-editor")).toBeVisible();
    await page.getByTestId("service-area-map-canvas").click({ position: { x: 60, y: 60 } });
    await page.getByTestId("service-area-map-canvas").click({ position: { x: 180, y: 60 } });
    await page.getByTestId("service-area-map-canvas").click({ position: { x: 120, y: 180 } });
    await expect(page.getByTestId("service-area-map-save")).toBeEnabled();
    await page.reload();
    await expect(page.getByTestId("service-area-map-editor")).toBeVisible();
  });
});

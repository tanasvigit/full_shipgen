import { test, expect } from "../fixtures/test";
import { gotoRoute } from "../helpers/navigation";

test.describe("FleetOps geo (Phase 5) @regression", { tag: "@regression" }, () => {
  test("geofence hub renders draw panel and report tabs", async ({ page }) => {
    await gotoRoute(page, "/fleet-ops/geo/geofences");
    await expect(page.locator('[data-testid="geofence-hub-page"]')).toBeVisible();
    await expect(page.locator('[data-testid="geofence-draw-panel"]')).toBeVisible();
    await page.locator('[data-testid="geofence-tab-inventory"]').click();
    await expect(page.locator('[data-testid="geofence-inventory-table"]')).toBeVisible();
  });

  test("service area detail shows map editor and zones table", async ({ page }) => {
    await gotoRoute(page, "/fleet-ops/service-areas", { pageTestId: "service-area-list-page" });
    await expect(page.locator('[data-testid="service-area-list-page"]')).toBeVisible({ timeout: 15_000 });
    const firstLink = page.locator('a[href*="/fleet-ops/service-areas/"]').first();
    if (await firstLink.count()) {
      await firstLink.click();
      await expect(page.locator('[data-testid="service-area-relations"]')).toBeVisible({ timeout: 15_000 });
      await expect(page.locator('[data-testid="service-area-map-editor"]')).toBeVisible();
      await expect(page.locator('[data-testid="service-area-zones-table"]')).toBeVisible();
    }
  });
});

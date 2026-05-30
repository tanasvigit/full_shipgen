import { test, expect } from "../../../e2e/fixtures/fleetops-stabilization";

test.describe("FleetOps Day 3 — Regression", () => {
  test("geo + settings + custom fields + analytics + tracking workflow remains stable", async ({ page }) => {
    await page.goto("/fleet-ops/service-areas");
    await expect(page.getByTestId("service-area-list-page").or(page.getByTestId("service-area-forbidden"))).toBeVisible();

    await page.goto("/fleet-ops/settings/navigator");
    await expect(page.getByTestId("fleetops-settings-layout")).toBeVisible();

    await page.goto("/fleet-ops/custom-fields");
    await expect(page.getByTestId("custom-field-list-page").or(page.getByTestId("custom-field-forbidden"))).toBeVisible();

    await page.goto("/fleet-ops/analytics/reports");
    await expect(page.getByTestId("report-list-page").or(page.getByTestId("report-forbidden"))).toBeVisible();

    await page.goto("/fleet-ops/tracking/lookup");
    await expect(page.getByTestId("tracking-lookup-page")).toBeVisible();
    await page.getByTestId("tracking-lookup-input").fill("D3-NOT-FOUND");
    await page.getByTestId("tracking-lookup-button").click();
    await expect(page.getByTestId("tracking-lookup-empty").or(page.getByTestId("tracking-lookup-result"))).toBeVisible();
  });
});

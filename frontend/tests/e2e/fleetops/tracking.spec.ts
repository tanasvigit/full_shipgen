import { test, expect } from "../../../e2e/fixtures/fleetops-stabilization";
import { waitForApiSettle } from "../../../e2e/helpers/network";
import { runViewportMatrix } from "../../../e2e/helpers/fleetops/stabilization";

test.describe("FleetOps Day 2 — Fleet tracking", () => {
  test("G022 tracking page loads + refresh + reload stability", async ({ page }) => {
    await page.goto("/fleet-ops/connectivity/tracking");
    await expect(page.getByTestId("fleet-tracking-hub")).toBeVisible();
    await waitForApiSettle(page);
    await expect(page.getByTestId("fleet-tracking-map")).toBeVisible({ timeout: 30_000 });
    await page.getByTestId("tracking-refresh").click();
    await waitForApiSettle(page);
    await page.reload();
    await expect(page.getByTestId("fleet-tracking-map")).toBeVisible({ timeout: 30_000 });
  });

  test("realtime-style repeated refresh has no duplicate loop symptoms", async ({ page }) => {
    await page.goto("/fleet-ops/connectivity/tracking");
    await expect(page.getByTestId("fleet-tracking-hub")).toBeVisible();
    for (let i = 0; i < 3; i += 1) {
      await page.getByTestId("tracking-refresh").click();
      await waitForApiSettle(page);
    }
    await expect(page.getByTestId("fleet-tracking-map")).toBeVisible();
  });

  test("viewport matrix map usability (390/768/1440)", async ({ page }) => {
    await runViewportMatrix(page, async () => {
      await page.goto("/fleet-ops/connectivity/tracking");
      await expect(page.getByTestId("fleet-tracking-hub")).toBeVisible();
      await expect(page.getByTestId("fleet-tracking-map")).toBeVisible({ timeout: 30_000 });
    });
  });
});

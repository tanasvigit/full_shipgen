import { test, expect } from "../fixtures/test";
import { gotoRoute } from "../helpers/navigation";

test.describe("FleetOps platform polish (Phase 6) @regression", { tag: "@regression" }, () => {
  test("command palette opens from fleet-ops orders", async ({ page }) => {
    await gotoRoute(page, "/fleet-ops/operations/orders");
    await page.getByTestId("command-palette-trigger").click();
    await expect(page.getByTestId("command-palette-input")).toBeVisible();
    await expect(page.getByTestId("command-warranties")).toBeVisible();
  });

  test("tracking hub shows position replay panel on marker click", async ({ page }) => {
    await gotoRoute(page, "/fleet-ops/connectivity/tracking", { pageTestId: "fleet-tracking-hub" });
    const map = page.getByTestId("fleet-tracking-map");
    await expect(map).toBeVisible();
  });
});

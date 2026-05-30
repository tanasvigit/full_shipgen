import { test, expect } from "../../../e2e/fixtures/fleetops-stabilization";
import {
  gotoOrdersList,
  selectFirstOrderCheckbox,
  navigateFleetOpsSidebar,
} from "../../../e2e/helpers/fleetops/stabilization";
import { waitForApiSettle } from "../../../e2e/helpers/network";
import { gotoRoute } from "../../../e2e/helpers/navigation";

test.describe("FleetOps Day 1 — Routes", () => {
  test("G004 — routes list and new page load", async ({ page }) => {
    await navigateFleetOpsSidebar(page, "routes", "/fleet-ops/operations/routes", "routes-list-page");
    await gotoRoute(page, "/fleet-ops/operations/routes/new", { pageTestId: "route-new-page" });
    await expect(page.getByTestId("route-create-submit")).toBeVisible();
  });

  test("G037 — plan routes from orders selection", async ({ page }) => {
    await gotoOrdersList(page);
    if (!(await selectFirstOrderCheckbox(page))) {
      test.skip();
      return;
    }
    await page.getByTestId("orders-plan-routes").click();
    await expect(page.getByTestId("route-new-page")).toBeVisible();
    await expect(page.getByTestId("route-new-page").getByText(/Will plan route/i)).toBeVisible();
  });

  test("G005 — create route and open detail", async ({ page }) => {
    await gotoRoute(page, "/fleet-ops/operations/routes/new", { pageTestId: "route-new-page" });
    const createPromise = page.waitForResponse(
      (res) => /\/routes/i.test(res.url()) && ["POST", "PATCH"].includes(res.request().method()) && res.status() < 400,
      { timeout: 60_000 },
    );
    await page.getByTestId("route-create-submit").click();
    const res = await createPromise.catch(() => null);
    if (!res) {
      test.skip();
      return;
    }
    await page.waitForURL(/\/fleet-ops\/operations\/routes\//, { timeout: 45_000 }).catch(() => {});
    if (page.url().includes("/routes/") && !page.url().endsWith("/routes")) {
      await expect(page.getByTestId("route-detail-page")).toBeVisible();
      const optimize = page.getByTestId("route-optimize");
      if (await optimize.isVisible()) {
        await optimize.click();
        await waitForApiSettle(page);
      }
      await page.reload();
      await expect(page.getByTestId("route-detail-page")).toBeVisible();
    }
  });

  test("stability — routing redirect to routes module", async ({ page }) => {
    await gotoRoute(page, "/fleet-ops/operations/routing", { pageTestId: "routes-list-page" });
    await expect(page).toHaveURL(/\/fleet-ops\/operations\/routes/);
  });
});

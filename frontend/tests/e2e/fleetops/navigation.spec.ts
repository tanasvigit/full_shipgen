import { test, expect } from "../../../e2e/fixtures/fleetops-stabilization";
import {
  gotoOrdersList,
  FLEETOPS_DAY1_ROUTES,
  runViewportMatrix,
} from "../../../e2e/helpers/fleetops/stabilization";
import { gotoRoute } from "../../../e2e/helpers/navigation";
import { waitForApiSettle } from "../../../e2e/helpers/network";

test.describe("FleetOps Day 1 — Navigation & state", () => {
  test("sidebar navigation across Day 1 modules", async ({ page }) => {
    await gotoOrdersList(page);
    for (const route of FLEETOPS_DAY1_ROUTES) {
      await page.getByTestId(`sidebar-link-${route.slug}`).click();
      await page.waitForURL((url) => url.pathname.startsWith(route.path));
      await expect(page.getByTestId(route.testId)).toBeVisible({ timeout: 45_000 });
      await waitForApiSettle(page);
    }
  });

  test("deep link to orders with query survives reload", async ({ page }) => {
    await page.goto("/fleet-ops/operations/orders?status=created&without_driver=1&layout=table");
    await expect(page.getByTestId("orders-list-page")).toBeVisible({ timeout: 45_000 });
    const url = new URL(page.url());
    expect(url.searchParams.get("status")).toBe("created");
    expect(url.searchParams.get("without_driver")).toBe("1");
    await page.reload();
    await expect(page.getByTestId("orders-list-page")).toBeVisible();
    expect(new URL(page.url()).searchParams.get("status")).toBe("created");
  });

  test("invalid fleet-ops path does not blank console", async ({ page }) => {
    await gotoOrdersList(page);
    await page.goto("/fleet-ops/operations/not-a-real-route");
    await expect(page.getByTestId("console-layout")).toBeVisible({ timeout: 30_000 });
  });

  test("viewport matrix — orders list usable", async ({ page }) => {
    await runViewportMatrix(page, async (label) => {
      await gotoOrdersList(page);
      await expect(page.getByTestId("orders-list-page")).toBeVisible();
      const table = page.getByTestId("orders-table");
      await expect(table.or(page.getByTestId("orders-kanban-loading"))).toBeVisible();
      test.info().annotations.push({ type: "viewport", description: label });
    });
  });
});

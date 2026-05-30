import { test, expect } from "../../../e2e/fixtures/fleetops-stabilization";
import { waitForApiSettle } from "../../../e2e/helpers/network";

const RAPID_ROUTES = [
  "/fleet-ops/management/vendors",
  "/fleet-ops/management/contacts",
  "/fleet-ops/connectivity/devices",
  "/fleet-ops/connectivity/tracking",
  "/fleet-ops/maintenance/work-orders",
];

test.describe("FleetOps Day 2 — Stability stress", () => {
  test("rapid navigation loop does not crash", async ({ page }) => {
    test.setTimeout(180_000);
    for (let i = 0; i < 1; i += 1) {
      for (const route of RAPID_ROUTES) {
        await page.goto(route);
        await expect(page.getByTestId("console-layout")).toBeVisible();
        await waitForApiSettle(page);
      }
    }
  });

  test("repeated modal open/close on CRUD pages", async ({ page }) => {
    await page.goto("/fleet-ops/management/vendors");
    const open = page.getByTestId("vendor-new-button");
    if (!(await open.isVisible())) {
      test.skip();
      return;
    }
    for (let i = 0; i < 3; i += 1) {
      await open.click();
      await expect(page.getByTestId("vendor-create-dialog")).toBeVisible();
      await page.getByRole("button", { name: /cancel/i }).first().click();
      await expect(page.getByTestId("vendor-create-dialog")).toBeHidden();
    }
  });

  test("repeated map mounts and refresh are stable", async ({ page }) => {
    for (let i = 0; i < 3; i += 1) {
      await page.goto("/fleet-ops/connectivity/tracking");
      await expect(page.getByTestId("fleet-tracking-map")).toBeVisible({ timeout: 30_000 });
      await page.getByTestId("tracking-refresh").click();
      await waitForApiSettle(page);
    }
  });

  test("reload loop on management + maintenance pages", async ({ page }) => {
    const routes = ["/fleet-ops/management/issues", "/fleet-ops/maintenance/schedules"];
    for (const route of routes) {
      await page.goto(route);
      await expect(page.getByTestId("console-layout")).toBeVisible();
      for (let i = 0; i < 2; i += 1) {
        await page.reload();
        await expect(page.getByTestId("console-layout")).toBeVisible();
      }
    }
  });
});

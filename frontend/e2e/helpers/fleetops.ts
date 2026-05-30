import { expect, type Page } from "@playwright/test";
import { PROTECTED_ROUTES } from "./routes";

export const FLEETOPS_ROUTES = PROTECTED_ROUTES.filter((r) => r.module === "fleetops");

export const FLEETOPS_SIDEBAR_LINKS = FLEETOPS_ROUTES.filter((r) => r.sidebarSlug).map((r) => ({
  slug: r.sidebarSlug!,
  path: r.path,
  pageTestId: r.testId,
}));

export const FLEETOPS_TABLES: Record<string, string> = {
  "/fleet-ops/operations/orders": "orders-table",
  "/fleet-ops/management/drivers": "drivers-table",
  "/fleet-ops/management/vehicles": "vehicles-table",
  "/fleet-ops/management/places": "places-table",
};

export async function enterFleetOpsModule(page: Page) {
  await page.getByTestId("nav-fleet-ops").click();
  await page.waitForURL(/\/fleet-ops/);
  await expect(page.getByTestId("orders-list-page")).toBeVisible({ timeout: 30_000 });
}

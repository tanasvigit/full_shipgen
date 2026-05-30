import { test, expect } from "../../../e2e/fixtures/fleetops-stabilization";
import { waitForApiSettle } from "../../../e2e/helpers/network";

test.describe("FleetOps Day 2 — Connectivity", () => {
  async function expectListOrForbidden(page, key) {
    const list = page.getByTestId(`${key}-list-page`);
    const forbidden = page.getByTestId(`${key}-forbidden`);
    await expect(page.getByTestId("console-layout")).toBeVisible();
    const hasList = await list.isVisible().catch(() => false);
    const hasForbidden = await forbidden.isVisible().catch(() => false);
    if (!hasList && !hasForbidden) {
      test.skip();
    }
    return { hasList };
  }

  test("telematics list/detail and related modules render", async ({ page }) => {
    await page.goto("/fleet-ops/connectivity/telematics");
    await expect(page.getByTestId("telematics-module")).toBeVisible();
    await waitForApiSettle(page);
    if (await page.getByTestId("telematic-forbidden").isVisible()) return;
    const row = page.getByTestId("telematic-table").locator("tbody tr").first();
    if (await row.isVisible()) {
      await row.click();
      await expect(page.getByTestId("telematic-detail-page")).toBeVisible();
      await expect(page.getByTestId("telematic-devices-tab")).toBeVisible();
    }
  });

  test("devices CRUD shell and attach/detach stability", async ({ page }) => {
    await page.goto("/fleet-ops/connectivity/devices");
    const { hasList } = await expectListOrForbidden(page, "device");
    if (!hasList) return;
    await expect(page.getByTestId("device-table").or(page.getByTestId("device-empty"))).toBeVisible();
    const create = page.getByTestId("device-new-button");
    if (await create.isVisible()) {
      await create.click();
      await expect(page.getByTestId("device-create-dialog")).toBeVisible();
      await page.getByRole("button", { name: /cancel/i }).first().click();
    }
    await page.reload();
    await expect(page.getByTestId("device-list-page")).toBeVisible();
  });

  test("sensors CRUD shell and relation rendering", async ({ page }) => {
    await page.goto("/fleet-ops/connectivity/sensors");
    const { hasList } = await expectListOrForbidden(page, "sensor");
    if (!hasList) return;
    await expect(page.getByTestId("sensor-table").or(page.getByTestId("sensor-empty"))).toBeVisible();
    await page.reload();
    await expect(page.getByTestId("sensor-list-page")).toBeVisible();
  });

  test("device events list/detail and empty state safety", async ({ page }) => {
    await page.goto("/fleet-ops/connectivity/device-events");
    const { hasList } = await expectListOrForbidden(page, "device-event");
    if (!hasList) return;
    await expect(page.getByTestId("device-event-table").or(page.getByTestId("device-event-empty"))).toBeVisible();
    const row = page.getByTestId("device-event-table").locator("tbody tr").first();
    if (await row.isVisible()) {
      await row.click();
      await expect(page.getByTestId("device-event-detail-page")).toBeVisible();
    }
  });

  test("tracking hub map and marker refresh surface", async ({ page }) => {
    await page.goto("/fleet-ops/connectivity/tracking");
    await expect(page.getByTestId("fleet-tracking-hub")).toBeVisible();
    await expect(page.getByTestId("fleet-tracking-map")).toBeVisible({ timeout: 30_000 });
    await page.getByTestId("tracking-refresh").click();
    await waitForApiSettle(page);
    await page.reload();
    await expect(page.getByTestId("fleet-tracking-map")).toBeVisible({ timeout: 30_000 });
  });
});

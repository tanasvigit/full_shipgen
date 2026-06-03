import { test, expect } from "../fixtures/test";
import { gotoRoute } from "../helpers/navigation";
import { createNotificationKey } from "../../src/lib/fleetops/createNotificationKey.js";

const MOCK_REGISTRY = [
  {
    name: "orderCreated",
    definition: "Fleetbase\\FleetOps\\Notifications\\OrderCreated",
    description: "When a new order is created",
    package: "fleet-ops",
  },
];

const MOCK_NOTIFIABLES = [
  {
    label: "User: Admin",
    value: "user:admin-uuid",
    key: "admin-uuid",
    definition: "Fleetbase\\Models\\User",
  },
];

test.describe("FleetOps settings (Phase 5) @regression", { tag: "@regression" }, () => {
  test("settings layout shows extended tabs", async ({ page }) => {
    await gotoRoute(page, "/fleet-ops/settings");
    await expect(page.locator('[data-testid="fleetops-settings-layout"]')).toBeVisible();
    await expect(page.locator('[data-testid="fleetops-settings-tab-notifications"]')).toBeVisible();
    await expect(page.locator('[data-testid="fleetops-settings-tab-payments"]')).toBeVisible();
  });

  test("notifications settings page loads", async ({ page }) => {
    await gotoRoute(page, "/fleet-ops/settings/notifications");
    await expect(page.locator('[data-testid="fleetops-settings-notifications-page"]')).toBeVisible();
  });

  test("notifications save POSTs notificationSettings and reload shows persisted state", async ({ page }) => {
    const notificationKey = createNotificationKey(MOCK_REGISTRY[0].definition, MOCK_REGISTRY[0].name);
    let persisted = {};

    await page.route("**/fleet-ops/settings/notification-settings**", async (route) => {
      const method = route.request().method();
      if (method === "GET") {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            status: "ok",
            notificationSettings: persisted,
          }),
        });
        return;
      }
      if (method === "POST") {
        const body = route.request().postDataJSON();
        expect(body).toHaveProperty("notificationSettings");
        expect(typeof body.notificationSettings).toBe("object");
        persisted = body.notificationSettings;
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ status: "ok", message: "Notification settings succesfully saved." }),
        });
        return;
      }
      await route.continue();
    });

    await page.route("**/fleet-ops/settings/notification-registry**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(MOCK_REGISTRY),
      });
    });

    await page.route("**/fleet-ops/settings/notification-notifiables**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(MOCK_NOTIFIABLES),
      });
    });

    await gotoRoute(page, "/fleet-ops/settings/notifications");
    await expect(page.getByTestId("fleetops-settings-notifications-page")).toBeVisible();

    const row = page.getByTestId(`fleetops-settings-notifications-row-${notificationKey}`);
    await expect(row).toBeVisible({ timeout: 15_000 });

    const selectBtn = page.getByTestId(
      `fleetops-settings-notifications-notifiables-${notificationKey}`,
    );
    await selectBtn.click();
    await page.getByTestId(`fleetops-settings-notifications-notifiables-${notificationKey}-select-all`).click();

    const postPromise = page.waitForRequest(
      (req) =>
        req.method() === "POST" &&
        req.url().includes("/fleet-ops/settings/notification-settings") &&
        Boolean(req.postDataJSON()?.notificationSettings),
    );

    await page.getByTestId("fleetops-settings-notifications-save").click();
    const postReq = await postPromise;
    const posted = postReq.postDataJSON().notificationSettings;
    expect(posted[notificationKey]?.notifiables?.length).toBeGreaterThan(0);

    await page.reload({ waitUntil: "load" });
    await expect(row).toBeVisible();
    await selectBtn.click();
    await expect(
      page.getByTestId(`fleetops-settings-notifications-notifiables-${notificationKey}-select-all`),
    ).toBeChecked();
  });

  test("navigator settings page loads", async ({ page }) => {
    await gotoRoute(page, "/fleet-ops/settings/navigator");
    await expect(page.locator('[data-testid="fleetops-settings-navigator-page"]')).toBeVisible({ timeout: 15_000 });
  });
});

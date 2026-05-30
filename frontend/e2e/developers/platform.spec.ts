import { test, expect } from "../fixtures/test";
import { gotoRoute, expectPageRoot } from "../helpers/navigation";
import { expectDataTableReady, expectListSurface, searchDataTable } from "../helpers/page";

test.describe("Developers", () => {
  test("developers home", async ({ page }) => {
    await gotoRoute(page, "/developers");
    await expectPageRoot(page, "developers-home");
  });

  test("API keys — list and create dialog cancel", async ({ page }) => {
    await gotoRoute(page, "/developers/api-keys");
    await expectPageRoot(page, "api-keys-list-page");
    await expectListSurface(page, {
      tableTestId: "api-keys-table",
      emptyTestIds: ["api-keys-empty"],
    });
    const create = page.locator('[data-testid="new-api-key-button"]');
    if (await create.isVisible()) {
      await create.click();
      const dialog = page.getByRole("dialog");
      await expect(dialog).toBeVisible();
      await page.getByRole("button", { name: /cancel/i }).first().click();
    }
  });

  test("webhooks list", async ({ page }) => {
    await gotoRoute(page, "/developers/webhooks");
    await expectPageRoot(page, "webhooks-list-page");
    await expectListSurface(page, { tableTestId: "webhooks-table", emptyTestIds: ["webhooks-empty"] });
  });

  test("events, logs, sockets", async ({ page }) => {
    await gotoRoute(page, "/developers/events");
    await expectPageRoot(page, "events-list-page");
    await page.locator('[data-testid="events-search"]').waitFor({ state: "visible" });
    await gotoRoute(page, "/developers/logs");
    await expectPageRoot(page, "logs-list-page");
    await expectDataTableReady(page, "logs-table");
    await searchDataTable(page, " ", "logs-table");
    await gotoRoute(page, "/developers/sockets");
    await expectPageRoot(page, "sockets-list-page");
    await expectListSurface(page, {
      cardSelector: '[data-testid^="socket-card-"]',
      emptyTestIds: ["sockets-empty"],
    });
  });
});

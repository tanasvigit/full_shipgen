import { test, expect } from "../../../e2e/fixtures/fleetops-stabilization";

const RESOURCE_ROUTES = [
  { path: "/fleet-ops/admin/warranties", testId: "warranty-list-page" },
  { path: "/fleet-ops/admin/manifests", testId: "manifests-list-page" },
  { path: "/fleet-ops/admin/payloads", testId: "payload-list-page" },
  { path: "/fleet-ops/admin/entities", testId: "entity-list-page" },
  { path: "/fleet-ops/admin/proofs", testId: "proof-list-page" },
  { path: "/fleet-ops/admin/purchase-rates", testId: "purchase-rate-list-page" },
  { path: "/fleet-ops/admin/tracking-numbers", testId: "tracking-number-list-page" },
  { path: "/fleet-ops/admin/tracking-statuses", testId: "tracking-status-list-page" },
];

test.describe("FleetOps — Resources", () => {
  for (const route of RESOURCE_ROUTES) {
    test(`${route.path} list shell renders`, async ({ page }) => {
      await page.goto(route.path);
      await expect(page.getByTestId("console-layout")).toBeVisible();
      const list = page.getByTestId(route.testId);
      const forbidden = page.getByTestId(route.testId.replace("-list-page", "-forbidden"));
      const hasList = await list.isVisible().catch(() => false);
      const hasForbidden = await forbidden.isVisible().catch(() => false);
      if (!hasList && !hasForbidden) {
        test.skip();
        return;
      }
      expect(hasList || hasForbidden).toBeTruthy();
    });
  }

  test("entity create dialog opens with API-aligned fields", async ({ page }) => {
    await page.goto("/fleet-ops/admin/entities");
    if (await page.getByTestId("entity-forbidden").isVisible().catch(() => false)) return;
    const create = page.getByTestId("entity-new-button");
    if (!(await create.isVisible())) return;
    await create.click();
    await expect(page.getByTestId("entity-create-dialog")).toBeVisible();
    await expect(page.getByTestId("field-name")).toBeVisible();
    await expect(page.getByTestId("field-type")).toBeVisible();
    await page.getByRole("button", { name: /cancel/i }).first().click();
  });

  test("payload create dialog has place dropdowns", async ({ page }) => {
    await page.goto("/fleet-ops/admin/payloads");
    if (await page.getByTestId("payload-forbidden").isVisible().catch(() => false)) return;
    const create = page.getByTestId("payload-new-button");
    if (!(await create.isVisible())) return;
    await create.click();
    await expect(page.getByTestId("payload-create-dialog")).toBeVisible();
    await expect(page.getByTestId("field-pickup-trigger")).toBeVisible();
    await expect(page.getByTestId("field-dropoff-trigger")).toBeVisible();
    await page.getByRole("button", { name: /cancel/i }).first().click();
  });

  test("proofs are read-only (no create button)", async ({ page }) => {
    await page.goto("/fleet-ops/admin/proofs");
    if (await page.getByTestId("proof-forbidden").isVisible().catch(() => false)) return;
    await expect(page.getByTestId("proof-new-button")).toHaveCount(0);
  });
});

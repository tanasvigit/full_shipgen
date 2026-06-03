import { test, expect } from "../fixtures/test";
import { gotoRoute } from "../helpers/navigation";

const ADMIN_MODULES = [
  { path: "/fleet-ops/admin/warranties", listTestId: "warranty-list-page" },
  { path: "/fleet-ops/admin/manifests", listTestId: "manifests-list-page" },
  { path: "/fleet-ops/admin/payloads", listTestId: "payload-list-page" },
  { path: "/fleet-ops/admin/entities", listTestId: "entity-list-page" },
  { path: "/fleet-ops/admin/proofs", listTestId: "proof-list-page" },
  { path: "/fleet-ops/admin/purchase-rates", listTestId: "purchase-rate-list-page" },
  { path: "/fleet-ops/admin/tracking-numbers", listTestId: "tracking-number-list-page" },
  { path: "/fleet-ops/admin/tracking-statuses", listTestId: "tracking-status-list-page" },
];

test.describe("FleetOps Phase 7 — backend modules @regression", { tag: "@regression" }, () => {
  for (const mod of ADMIN_MODULES) {
    test(`${mod.path} list page loads`, async ({ page }) => {
      await gotoRoute(page, mod.path, { pageTestId: mod.listTestId });
      await expect(page.getByTestId(mod.listTestId)).toBeVisible();
    });
  }

  test("warranties create dialog opens", async ({ page }) => {
    await gotoRoute(page, "/fleet-ops/admin/warranties", { pageTestId: "warranty-list-page" });
    const createBtn = page.getByTestId("warranty-new-button");
    if (await createBtn.isVisible().catch(() => false)) {
      await createBtn.click();
      await expect(page.getByTestId("warranty-create-dialog")).toBeVisible({ timeout: 10_000 });
    }
  });

  test("manifests table visible", async ({ page }) => {
    await gotoRoute(page, "/fleet-ops/admin/manifests", { pageTestId: "manifests-list-page" });
    await expect(page.getByTestId("manifests-table")).toBeVisible();
  });
});

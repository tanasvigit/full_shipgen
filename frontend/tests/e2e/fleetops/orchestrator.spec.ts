import { test, expect } from "../../../e2e/fixtures/fleetops-stabilization";
import { gotoRoute } from "../../../e2e/helpers/navigation";

test.describe("FleetOps Phase 2 — Orchestrator", () => {
  test("orchestrator page loads with engine selector", async ({ page }) => {
    await gotoRoute(page, "/fleet-ops/operations/orchestrator", { pageTestId: "orchestrator-page" });
    await expect(page.getByTestId("orchestrator-mode")).toBeVisible();
    await expect(page.getByTestId("orchestrator-engine")).toBeVisible();
    await expect(page.getByTestId("orchestrator-orders-table")).toBeVisible();
  });

  test("preview button triggers orchestrator API or shows error gracefully", async ({ page }) => {
    await gotoRoute(page, "/fleet-ops/operations/orchestrator", { pageTestId: "orchestrator-page" });
    const preview = page.getByTestId("orchestrator-preview");
    if (!(await preview.isVisible())) {
      test.skip();
      return;
    }
    await preview.click();
    await expect(
      page.getByTestId("orchestrator-preview-panel").or(page.locator('[data-sonner-toast]')),
    ).toBeVisible({ timeout: 30_000 });
  });

  test("import modal opens", async ({ page }) => {
    await gotoRoute(page, "/fleet-ops/operations/orchestrator", { pageTestId: "orchestrator-page" });
    const importBtn = page.getByTestId("orchestrator-import");
    if (!(await importBtn.isVisible())) {
      test.skip();
      return;
    }
    await importBtn.click();
    await expect(page.getByTestId("orchestrator-import-dialog")).toBeVisible();
  });
});

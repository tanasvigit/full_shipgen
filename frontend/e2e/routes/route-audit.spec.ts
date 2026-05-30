import { test, expect } from "../fixtures/test";
import { PROTECTED_ROUTES } from "../helpers/routes";
import { gotoRoute, expectPageRoot } from "../helpers/navigation";
import { attachDiagnostics, waitForApiSettle } from "../helpers/network";

test.describe("Route audit", () => {
  for (const route of PROTECTED_ROUTES) {
    test(`renders ${route.path} (${route.testId})`, async ({ page }) => {
      const diagnostics = attachDiagnostics(page);
      await page.goto(route.path, { waitUntil: "load", timeout: 60_000 });
      await page.locator(`[data-testid="${route.testId}"]`).waitFor({ state: "visible", timeout: 45_000 });
      await page.locator('[data-testid="console-layout"]').waitFor({ state: "visible", timeout: 15_000 }).catch(() => {});
      await waitForApiSettle(page);

      const main = page.locator('[data-testid="console-main"]');
      await expect(main).toBeVisible();

      // Page render is the gate; log 4xx from optional modules but only fail on server errors.
      const serverErrors = diagnostics.failures.filter((line) => {
        const status = Number.parseInt(line.split(" ")[0], 10);
        return status >= 500;
      });
      if (serverErrors.length > 0) {
        throw new Error(`Server errors on ${route.path}:\n${serverErrors.join("\n")}`);
      }
    });
  }
});

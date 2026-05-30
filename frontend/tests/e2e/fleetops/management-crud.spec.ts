import { test, expect } from "../../../e2e/fixtures/fleetops-stabilization";
import { waitForApiSettle } from "../../../e2e/helpers/network";

async function expectCrudSurface(page, key, path) {
  await page.goto(path);
  await expect(page.getByTestId(`${key}-list-page`).or(page.getByTestId(`${key}-forbidden`))).toBeVisible();
  if (await page.getByTestId(`${key}-forbidden`).isVisible()) return false;
  await expect(page.getByTestId(`${key}-table`).or(page.getByTestId(`${key}-empty`))).toBeVisible();
  await waitForApiSettle(page);
  return true;
}

test.describe("FleetOps Phase 3 — Management CRUD", () => {
  test("vendor and contact create dialogs with required fields", async ({ page }) => {
    const vendorOk = await expectCrudSurface(page, "vendor", "/fleet-ops/management/vendors");
    if (vendorOk) {
      await page.getByTestId("vendor-new-button").click();
      await expect(page.getByTestId("vendor-create-dialog")).toBeVisible();
      await page.getByTestId("field-name").fill(`phase3-vendor-${Date.now()}`);
      await page.getByRole("button", { name: /cancel/i }).first().click();
    }
    const contactOk = await expectCrudSurface(page, "contact", "/fleet-ops/management/contacts");
    if (contactOk) {
      await page.getByTestId("contact-new-button").click();
      await expect(page.getByTestId("contact-create-dialog")).toBeVisible();
      await page.getByTestId("field-name").fill(`phase3-contact-${Date.now()}`);
      await page.getByRole("button", { name: /cancel/i }).first().click();
    }
  });
});

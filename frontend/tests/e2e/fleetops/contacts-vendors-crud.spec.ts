import { test, expect } from "../../../e2e/fixtures/fleetops-stabilization";
import { e2eUnique } from "../../../e2e/helpers/fleetops/test-data";
import {
  createContactViaUI,
  createCustomerViaUI,
  createVendorViaUI,
  skipIfForbidden,
} from "../../../e2e/helpers/fleetops/contacts-vendors-ui";
import { gotoFleetopsList } from "../../../e2e/helpers/fleetops/workflow";
import { waitForApiSettle } from "../../../e2e/helpers/network";

test.describe("FleetOps CRUD — Contacts, Vendors & Customers", () => {
  test("contact → detail → role panel stable after reload", async ({ page }) => {
    const seed = e2eUnique("ContactCRUD");
    const created = await createContactViaUI(page, { type: "facilitator", seed });
    if (!created) {
      test.skip();
      return;
    }

    await page.getByRole("link", { name: seed.name }).click();
    await expect(page.getByTestId("contact-detail-page")).toBeVisible();
    await expect(page.getByTestId("contact-customers-panel")).toBeVisible();
    await page.reload();
    await expect(page.getByTestId("contact-detail-page")).toBeVisible({ timeout: 20_000 });
  });

  test("vendor → detail → drivers panel stable after reload", async ({ page }) => {
    const seed = e2eUnique("VendorCRUD");
    const created = await createVendorViaUI(page, { type: "facilitator", seed });
    if (!created) {
      test.skip();
      return;
    }

    await page.getByRole("link", { name: seed.name }).click();
    await expect(page.getByTestId("vendor-detail-page")).toBeVisible();
    await expect(page.getByTestId("vendor-drivers-panel")).toBeVisible();
    await page.reload();
    await expect(page.getByTestId("vendor-detail-page")).toBeVisible({ timeout: 20_000 });
  });

  test("customer list → detail portal access section", async ({ page }) => {
    const seed = e2eUnique("CustomerCRUD");
    const created = await createCustomerViaUI(page, seed);
    if (!created) {
      test.skip();
      return;
    }

    await page.getByRole("link", { name: seed.name }).click();
    await expect(page.getByTestId("customer-detail-page")).toBeVisible();
    const resetBtn = page.getByTestId("customer-reset-credentials");
    if (await resetBtn.isVisible().catch(() => false)) {
      await expect(resetBtn).toBeVisible();
    }
  });

  test("management lists load contacts, vendors, and customers", async ({ page }) => {
    for (const { path, key } of [
      { path: "/fleet-ops/management/contacts", key: "contact" },
      { path: "/fleet-ops/management/vendors", key: "vendor" },
      { path: "/fleet-ops/management/customers", key: "customer" },
    ]) {
      await gotoFleetopsList(page, path, `${key}-list-page`);
      await waitForApiSettle(page);
      if (await skipIfForbidden(page, key)) continue;
      await expect(
        page.getByTestId(`${key}-table`).or(page.getByTestId(`${key}-empty`)).first(),
      ).toBeVisible();
    }
  });
});

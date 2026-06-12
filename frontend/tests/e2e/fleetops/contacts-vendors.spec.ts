import { test, expect } from "../../../e2e/fixtures/fleetops-stabilization";
import { waitForApiSettle } from "../../../e2e/helpers/network";
import {
  assignDriverToVendorViaApi,
  createContactViaApi,
  createOrderWithPartiesViaApi,
  createVendorViaApi,
  deleteContactViaApi,
  deleteVendorViaApi,
  getDriverViaApi,
  getFirstDriverUuid,
  listCustomersViaApi,
  listMorphCustomersViaApi,
  listMorphFacilitatorsViaApi,
} from "../../../e2e/helpers/fleetops/contacts-vendors-api";
import {
  assertNoForwardRefDialogWarning,
  createContactViaUI,
  createCustomerViaUI,
  createVendorViaUI,
  skipIfForbidden,
} from "../../../e2e/helpers/fleetops/contacts-vendors-ui";
import {
  selectFirstEntityOption,
  waitForEntitySelectReady,
} from "../../../e2e/helpers/fleetops/workflow";
import { e2eUnique } from "../../../e2e/helpers/fleetops/test-data";

test.describe("FleetOps — Contacts & Vendors integration", () => {
  test.describe("API — party resolution & morph lookups", () => {
    test("creates order with customer and facilitator UUIDs", async ({ request }) => {
      const customer = await createContactViaApi(request, { type: "customer" });
      const facilitator = await createVendorViaApi(request, { type: "facilitator" });

      try {
        const order = await createOrderWithPartiesViaApi(request, {
          customerUuid: customer.uuid,
          facilitatorUuid: facilitator.uuid,
        });

        expect(order.customer_uuid, "customer_uuid should be set").toBe(customer.uuid);
        expect(order.facilitator_uuid, "facilitator_uuid should be set").toBe(facilitator.uuid);
        expect(String(order.customer_type || "")).toMatch(/contact/i);
        expect(String(order.facilitator_type || "")).toMatch(/vendor/i);
      } finally {
        await deleteContactViaApi(request, customer.uuid).catch(() => {});
        await deleteVendorViaApi(request, facilitator.uuid).catch(() => {});
      }
    });

    test("creates order with customer and facilitator public IDs", async ({ request }) => {
      const customer = await createContactViaApi(request, { type: "customer" });
      const facilitator = await createVendorViaApi(request, { type: "facilitator" });

      try {
        const order = await createOrderWithPartiesViaApi(request, {
          customerUuid: customer.uuid,
          facilitatorUuid: facilitator.uuid,
          usePublicIds: true,
          customer,
          facilitator,
        });

        expect(order.customer_uuid).toBe(customer.uuid);
        expect(order.facilitator_uuid).toBe(facilitator.uuid);
      } finally {
        await deleteContactViaApi(request, customer.uuid).catch(() => {});
        await deleteVendorViaApi(request, facilitator.uuid).catch(() => {});
      }
    });

    test("morph customer and facilitator query endpoints return rows", async ({ request }) => {
      const customer = await createContactViaApi(request, { type: "customer" });
      const facilitator = await createVendorViaApi(request, { type: "facilitator" });

      try {
        const morphCustomers = await listMorphCustomersViaApi(request);
        const morphFacilitators = await listMorphFacilitatorsViaApi(request);
        const customersIndex = await listCustomersViaApi(request);

        expect(morphCustomers.length).toBeGreaterThan(0);
        expect(morphFacilitators.length).toBeGreaterThan(0);
        expect(
          customersIndex.length || morphCustomers.length,
          "GET /customers or /query/customers should return rows",
        ).toBeGreaterThan(0);
        expect(morphCustomers.some((row) => String((row as { uuid?: string }).uuid) === customer.uuid)).toBeTruthy();
        expect(
          morphFacilitators.some((row) => String((row as { uuid?: string }).uuid) === facilitator.uuid),
        ).toBeTruthy();
      } finally {
        await deleteContactViaApi(request, customer.uuid).catch(() => {});
        await deleteVendorViaApi(request, facilitator.uuid).catch(() => {});
      }
    });

    test("assigns driver to vendor via vendor endpoint", async ({ request }) => {
      const vendor = await createVendorViaApi(request, { type: "facilitator" });
      const driverUuid = await getFirstDriverUuid(request);
      test.skip(!driverUuid, "No drivers available for vendor assignment test.");

      try {
        await assignDriverToVendorViaApi(request, vendor.uuid, driverUuid!);
        const driver = await getDriverViaApi(request, driverUuid!);
        expect(driver.vendor_uuid).toBe(vendor.uuid);
      } finally {
        await deleteVendorViaApi(request, vendor.uuid).catch(() => {});
      }
    });
  });

  test.describe("UI — management surfaces", () => {
    test("contact create dialog has type field and no forwardRef warning", async ({ page }) => {
      await page.goto("/fleet-ops/management/contacts");
      if (await skipIfForbidden(page, "contact")) {
        test.skip();
        return;
      }
      await waitForApiSettle(page);

      await assertNoForwardRefDialogWarning(page, async () => {
        await page.getByTestId("contact-new-button").click();
        await expect(page.getByTestId("contact-create-dialog")).toBeVisible();
        await expect(page.getByTestId("field-type")).toBeVisible();
      });

      await page.getByRole("button", { name: /cancel/i }).first().click();
    });

    test("vendor create dialog exposes role select", async ({ page }) => {
      await page.goto("/fleet-ops/management/vendors");
      if (await skipIfForbidden(page, "vendor")) {
        test.skip();
        return;
      }
      await waitForApiSettle(page);
      await page.getByTestId("vendor-new-button").click();
      await expect(page.getByTestId("vendor-create-dialog")).toBeVisible();
      await expect(page.getByTestId("field-type")).toBeVisible();
      await page.getByRole("button", { name: /cancel/i }).first().click();
    });

    test("contact detail shows customer orders panel or role hint", async ({ page }) => {
      const seed = e2eUnique("ContactPanel");
      const created = await createContactViaUI(page, { type: "contact", seed });
      if (!created) {
        test.skip();
        return;
      }

      await page.getByRole("link", { name: seed.name }).click();
      await expect(page.getByTestId("contact-detail-page")).toBeVisible();
      await expect(page.getByTestId("contact-customers-panel")).toBeVisible();
      await expect(page.getByTestId("contact-customers-panel")).toContainText(/customer/i);
    });

    test("customer contact detail shows orders table region", async ({ page }) => {
      const seed = e2eUnique("CustContact");
      const created = await createContactViaUI(page, { type: "customer", seed });
      if (!created) {
        test.skip();
        return;
      }

      await page.getByRole("link", { name: seed.name }).click();
      await expect(page.getByTestId("contact-detail-page")).toBeVisible();
      await expect(page.getByTestId("contact-customers-panel")).toBeVisible();
      await expect(page.getByTestId("contact-customer-orders-table")).toBeVisible();
    });

    test("vendor detail renders assigned drivers panel", async ({ page }) => {
      const seed = e2eUnique("VendorDrivers");
      const created = await createVendorViaUI(page, { type: "facilitator", seed });
      if (!created) {
        test.skip();
        return;
      }

      await page.getByRole("link", { name: seed.name }).click();
      await expect(page.getByTestId("vendor-detail-page")).toBeVisible();
      await expect(page.getByTestId("vendor-drivers-panel")).toBeVisible();
    });

    test("order form loads customer and facilitator pickers", async ({ page }) => {
      await page.goto("/fleet-ops/operations/orders/new");
      await expect(page.getByTestId("order-form")).toBeVisible({ timeout: 30_000 });
      await waitForApiSettle(page);

      await waitForEntitySelectReady(page, "order-field-customer");
      await waitForEntitySelectReady(page, "order-field-facilitator");

      const pickedCustomer = await selectFirstEntityOption(page, "order-field-customer");
      const pickedFacilitator = await selectFirstEntityOption(page, "order-field-facilitator");
      expect(pickedCustomer || pickedFacilitator, "At least one party option should be selectable").toBeTruthy();
    });
  });
});

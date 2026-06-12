import { expect, type Page } from "@playwright/test";
import { e2eUnique } from "./test-data";
import {
  gotoFleetopsList,
  selectRadixOption,
  submitFleetOpsDialog,
} from "./workflow";
import { assertRecordInTable } from "./assertions";
import { waitForApiSettle } from "../network";

export async function skipIfForbidden(page: Page, key: string) {
  const forbidden = page.getByTestId(`${key}-forbidden`);
  if (await forbidden.isVisible().catch(() => false)) {
    return true;
  }
  return false;
}

export async function createContactViaUI(
  page: Page,
  options: { type?: string; seed?: ReturnType<typeof e2eUnique> } = {},
) {
  const seed = options.seed || e2eUnique("Contact");
  const type = options.type || "contact";

  await gotoFleetopsList(page, "/fleet-ops/management/contacts", "contact-list-page");
  if (await skipIfForbidden(page, "contact")) return null;

  await page.getByTestId("contact-new-button").click();
  await expect(page.getByTestId("contact-create-dialog")).toBeVisible();

  await page.getByTestId("field-name").fill(seed.name);
  await page.getByTestId("field-email").fill(seed.email);
  await page.getByTestId("field-phone").fill(seed.phone);
  await selectRadixOption(page, "field-type", new RegExp(type, "i"));

  await submitFleetOpsDialog(page, "contact-create-dialog", { resource: "contacts" });
  await waitForApiSettle(page);
  await assertRecordInTable(page, "contact-table", seed.name);
  return { ...seed, type };
}

export async function createVendorViaUI(
  page: Page,
  options: { type?: string; seed?: ReturnType<typeof e2eUnique> } = {},
) {
  const seed = options.seed || e2eUnique("Vendor");
  const type = options.type || "facilitator";

  await gotoFleetopsList(page, "/fleet-ops/management/vendors", "vendor-list-page");
  if (await skipIfForbidden(page, "vendor")) return null;

  await page.getByTestId("vendor-new-button").click();
  await expect(page.getByTestId("vendor-create-dialog")).toBeVisible();

  await page.getByTestId("field-name").fill(seed.name);
  await page.getByTestId("field-email").fill(seed.email);
  await selectRadixOption(page, "field-type", new RegExp(type, "i"));

  if (await page.getByTestId("field-country").isVisible().catch(() => false)) {
    await page.getByTestId("field-country").fill("US");
  }
  await submitFleetOpsDialog(page, "vendor-create-dialog", { resource: "vendors" });
  await waitForApiSettle(page);
  await assertRecordInTable(page, "vendor-table", seed.name);
  return { ...seed, type };
}

export async function createCustomerViaUI(page: Page, seed = e2eUnique("Customer")) {
  await page.goto("/fleet-ops/management/customers");
  await expect(
    page.getByTestId("customer-list-page").or(page.getByTestId("customer-forbidden")),
  ).toBeVisible({ timeout: 45_000 });
  if (await skipIfForbidden(page, "customer")) return null;
  await waitForApiSettle(page);

  await page.getByTestId("customer-new-button").click();
  await expect(page.getByTestId("customer-create-dialog")).toBeVisible();

  await page.getByTestId("field-name").fill(seed.name);
  await page.getByTestId("field-email").fill(seed.email);
  await page.getByTestId("field-phone").fill(seed.phone);

  await submitFleetOpsDialog(page, "customer-create-dialog", { resource: "contacts" });
  await waitForApiSettle(page);
  await assertRecordInTable(page, "customer-table", seed.name);

  return {
    ...seed,
    type: "customer",
  };
}

export async function assertNoForwardRefDialogWarning(page: Page, openDialog: () => Promise<void>) {
  const warnings: string[] = [];
  const handler = (msg: { type: () => string; text: () => string }) => {
    if (msg.type() === "warning" && /cannot be given refs|forwardRef/i.test(msg.text())) {
      warnings.push(msg.text());
    }
  };
  page.on("console", handler);
  await openDialog();
  page.off("console", handler);
  expect(warnings, `Unexpected React ref warnings:\n${warnings.join("\n")}`).toHaveLength(0);
}

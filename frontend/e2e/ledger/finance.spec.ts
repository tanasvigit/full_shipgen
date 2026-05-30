import { test, expect } from "../fixtures/test";
import { gotoRoute, expectPageRoot } from "../helpers/navigation";
import { expectDataTableReady, expectListSurface, openFirstTableRow } from "../helpers/page";
import { waitForApiSettle } from "../helpers/network";

test.describe("Ledger", () => {
  test("ledger home KPIs", async ({ page }) => {
    await gotoRoute(page, "/ledger");
    await expectPageRoot(page, "ledger-home");
  });

  test("invoices list and detail", async ({ page }) => {
    await gotoRoute(page, "/ledger/billing/invoices");
    await expectPageRoot(page, "invoices-list-page");
    await expectDataTableReady(page, "invoices-table");
    await waitForApiSettle(page);
    if (await openFirstTableRow(page, "invoices-table")) {
      await expect(page.locator('[data-testid="invoice-detail-page"]')).toBeVisible({ timeout: 15_000 });
    }
  });

  test("transactions and wallets", async ({ page }) => {
    await gotoRoute(page, "/ledger/payments/transactions");
    await expectDataTableReady(page, "transactions-table");
    await gotoRoute(page, "/ledger/payments/wallets");
    await expectPageRoot(page, "wallets-list-page");
    await expectListSurface(page, { cardSelector: '[data-testid^="wallet-card-"]' });
  });

  test("accounting and reports", async ({ page }) => {
    await gotoRoute(page, "/ledger/accounting/chart-of-accounts");
    await expectPageRoot(page, "chart-of-accounts-page");
    await expectDataTableReady(page, "accounts-table");
    await gotoRoute(page, "/ledger/accounting/journal");
    await expectPageRoot(page, "journal-entries-page");
    await gotoRoute(page, "/ledger/reports");
    await expectPageRoot(page, "ledger-reports-page");
  });
});

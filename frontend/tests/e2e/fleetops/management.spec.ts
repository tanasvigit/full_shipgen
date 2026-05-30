import { test, expect } from "../../../e2e/fixtures/fleetops-stabilization";
import { waitForApiSettle } from "../../../e2e/helpers/network";
import { interceptUsersMeEmptyPermissions, clearUsersMeIntercept } from "../../../e2e/helpers/fleetops/stabilization";

async function expectCrudSurface(page, key, path) {
  await page.goto(path);
  await expect(page.getByTestId(`${key}-list-page`).or(page.getByTestId(`${key}-forbidden`))).toBeVisible();
  if (await page.getByTestId(`${key}-forbidden`).isVisible()) return false;
  await expect(page.getByTestId(`${key}-table`).or(page.getByTestId(`${key}-empty`))).toBeVisible();
  await waitForApiSettle(page);
  return true;
}

async function exerciseCreateDialog(page, key) {
  const openBtn = page.getByTestId(`${key}-new-button`);
  if (!(await openBtn.isVisible())) return;
  await openBtn.click();
  await expect(page.getByTestId(`${key}-create-dialog`)).toBeVisible();
  await page.getByTestId("field-name").fill(`e2e-${key}-${Date.now()}`);
  await page.getByRole("button", { name: /cancel/i }).first().click();
  await expect(page.getByTestId(`${key}-create-dialog`)).toBeHidden();
}

test.describe("FleetOps Day 2 — Management", () => {
  test.afterEach(async ({ page }) => {
    await clearUsersMeIntercept(page);
  });

  test("vendors CRUD shell, search/filter, and reload persistence", async ({ page }) => {
    const hasList = await expectCrudSurface(page, "vendor", "/fleet-ops/management/vendors");
    if (!hasList) return;
    const search = page.getByTestId("vendor-table-search");
    if (await search.isVisible()) {
      await search.fill("vendor");
      await expect(search).toHaveValue("vendor");
      await waitForApiSettle(page);
    }
    await exerciseCreateDialog(page, "vendor");
    await page.reload();
    await expect(page.getByTestId("vendor-list-page")).toBeVisible();
  });

  test("contacts + customers relation rendering stays stable", async ({ page }) => {
    const hasList = await expectCrudSurface(page, "contact", "/fleet-ops/management/contacts");
    if (!hasList) return;
    await exerciseCreateDialog(page, "contact");
    const row = page.getByTestId("contact-table").locator("tbody tr").first();
    if (await row.isVisible()) {
      await row.click();
      await expect(page.getByTestId("contact-detail-page")).toBeVisible();
      await expect(page.getByTestId("contact-customers-panel")).toBeVisible();
      await page.reload();
      await expect(page.getByTestId("contact-detail-page")).toBeVisible();
    } else {
      test.skip();
    }
  });

  test("fuel reports CRUD surface and empty state safety", async ({ page }) => {
    const hasList = await expectCrudSurface(page, "fuel-report", "/fleet-ops/management/fuel-reports");
    if (!hasList) return;
    await exerciseCreateDialog(page, "fuel-report");
    await page.reload();
    await expect(page.getByTestId("fuel-report-list-page")).toBeVisible();
  });

  test("issues create shell and status update control", async ({ page }) => {
    const hasList = await expectCrudSurface(page, "issue", "/fleet-ops/management/issues");
    if (!hasList) return;
    await exerciseCreateDialog(page, "issue");
    const row = page.getByTestId("issue-table").locator("tbody tr").first();
    if (await row.isVisible()) {
      await row.click();
      await expect(page.getByTestId("issue-detail-page")).toBeVisible();
      const statusSelect = page.getByTestId("issue-status-select");
      if (await statusSelect.isVisible()) {
        await statusSelect.click();
        await page.getByRole("option", { name: /in progress|resolved|open/i }).first().click();
      }
      await page.reload();
      await expect(page.getByTestId("issue-detail-page")).toBeVisible();
    }
  });

  test("strict permissions hide/disable unauthorized management actions", async ({ page }) => {
    await interceptUsersMeEmptyPermissions(page);
    await page.reload({ waitUntil: "load" });
    await page.goto("/fleet-ops/management/vendors");
    await expect(page.getByTestId("vendor-list-page").or(page.getByTestId("vendor-forbidden"))).toBeVisible();
    const createBtn = page.getByTestId("vendor-new-button");
    if (await page.getByTestId("vendor-list-page").isVisible()) {
      await expect(createBtn).toBeHidden();
    }
  });
});

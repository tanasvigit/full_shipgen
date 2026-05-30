import { expect, type Page } from "@playwright/test";
import { waitForApiSettle } from "./network";
import { expectGlobalLoaderHidden } from "./fleetops/workflow";

export async function expectDataTableReady(page: Page, tableTestId = "data-table") {
  const table = page.getByTestId(tableTestId);
  await expect(table).toBeVisible({ timeout: 20_000 });
  await expect(page.getByTestId(`${tableTestId}-loader-overlay`)).toBeHidden({ timeout: 45_000 });
  const search = page.getByTestId(`${tableTestId}-search`);
  if (await search.isVisible().catch(() => false)) {
    await expect(search).toBeEnabled({ timeout: 15_000 });
  }
  await waitForApiSettle(page);
  return table;
}

/** Page may show a DataTable, empty state, or card grid — wait for any primary content. */
export async function expectListSurface(
  page: Page,
  options: {
    tableTestId?: string;
    emptyTestIds?: string[];
    cardSelector?: string;
  } = {},
) {
  const { tableTestId, emptyTestIds = [], cardSelector } = options;
  const candidates = [];

  if (tableTestId) {
    candidates.push(page.getByTestId(tableTestId));
  }
  for (const id of emptyTestIds) {
    candidates.push(page.getByTestId(id));
  }
  if (cardSelector) {
    candidates.push(page.locator(cardSelector).first());
  }

  if (candidates.length === 0) {
    throw new Error("expectListSurface: provide tableTestId, emptyTestIds, or cardSelector");
  }

  let visible = false;
  for (const locator of candidates) {
    try {
      await expect(locator).toBeVisible({ timeout: 15_000 });
      visible = true;
      break;
    } catch {
      /* try next surface */
    }
  }

  if (!visible) {
    throw new Error(`No list surface became visible (table=${tableTestId ?? "n/a"})`);
  }

  await waitForApiSettle(page);
}

export async function searchDataTable(page: Page, query: string, tableTestId = "data-table") {
  const search = page.getByTestId(`${tableTestId}-search`);
  if (await search.isVisible()) {
    await search.fill(query);
    await expect(search).toHaveValue(query);
    await waitForApiSettle(page);
  }
}

export async function openFirstTableRow(page: Page, tableTestId = "data-table") {
  const row = page.locator(`[data-testid^="${tableTestId}-row-"]`).first();
  if (await row.isVisible()) {
    await row.click();
    return true;
  }
  return false;
}

export async function testDialogOpenClose(page: Page, openTestId: string) {
  await page.getByTestId(openTestId).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await page.getByRole("button", { name: /cancel/i }).first().click();
  await expect(dialog).toBeHidden();
}

export async function paginateIfPresent(page: Page, tableTestId = "data-table") {
  const table = page.getByTestId(tableTestId);
  const next = page.getByTestId(`${tableTestId}-next`);
  if (!(await next.isVisible()) || !(await next.isEnabled())) {
    return;
  }

  const pageIndicator = table.getByText(/Page \d+ \/ \d+/);
  const before = (await pageIndicator.textContent()) ?? "";
  await next.click();
  if (before) {
    await expect(pageIndicator).not.toHaveText(before);
  } else {
    await waitForApiSettle(page);
  }

  const prev = page.getByTestId(`${tableTestId}-prev`);
  if (await prev.isEnabled()) {
    await prev.click();
    if (before) {
      await expect(pageIndicator).toHaveText(before);
    } else {
      await waitForApiSettle(page);
    }
  }
}

/** Exercise search, sort, and pagination on a DataTable when present. */
export async function exerciseDataTable(page: Page, tableTestId: string, searchSample = "a") {
  const table = await expectDataTableReady(page, tableTestId);
  const search = page.getByTestId(`${tableTestId}-search`);

  if (await search.isVisible()) {
    await search.fill(searchSample);
    await expect(search).toHaveValue(searchSample);
    await search.clear();
    await expect(search).toHaveValue("");
    await waitForApiSettle(page);
  }

  const sortableHeader = table.locator("thead th").filter({ has: page.locator("svg") }).first();
  if (await sortableHeader.isVisible()) {
    await sortableHeader.click();
    await waitForApiSettle(page);
    await sortableHeader.click();
    await waitForApiSettle(page);
  }

  await paginateIfPresent(page, tableTestId);
}

export async function openQuickCreateAndCancel(page: Page, openTestId: string) {
  await page.getByTestId(openTestId).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await page.getByRole("button", { name: /cancel/i }).first().click();
  await expect(dialog).toBeHidden();
}

/** Open a FleetOps entity modal, assert form test id, then cancel. */
export async function openFleetOpsFormAndCancel(
  page: Page,
  openTestId: string,
  options: { dialogTestId?: string; formTestId?: string } = {},
) {
  await page.getByTestId(openTestId).click();
  const dialogTestId = options.dialogTestId;
  const dialog = dialogTestId ? page.getByTestId(dialogTestId) : page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  if (options.formTestId) {
    await expect(page.getByTestId(options.formTestId)).toBeVisible();
  }
  await page.getByRole("button", { name: /cancel/i }).first().click();
  await expect(dialog).toBeHidden();
}

export async function openFirstDetailFromTable(
  page: Page,
  tableTestId: string,
  detailTestId: string,
): Promise<boolean> {
  const row = page.locator(`[data-testid^="${tableTestId}-row-"]`).first();
  if (!(await row.isVisible())) return false;
  await row.click();
  await expect(page.getByTestId(detailTestId)).toBeVisible({ timeout: 20_000 });
  return true;
}

/** Open a table row that contains the given text (after search). */
export async function openTableRowByText(
  page: Page,
  tableTestId: string,
  text: string,
  detailTestId: string,
  urlPattern?: RegExp,
) {
  await searchDataTable(page, text, tableTestId);
  const row = page.locator(`[data-testid^="${tableTestId}-row-"]`).filter({ hasText: text });
  await expect(row.first()).toBeVisible({ timeout: 20_000 });
  await expectGlobalLoaderHidden(page);
  const nav = urlPattern
    ? page.waitForURL(urlPattern, { timeout: 45_000 })
    : Promise.resolve();
  await Promise.all([nav, row.first().click()]);
  await expectGlobalLoaderHidden(page);
  await expect(page.getByTestId(detailTestId)).toBeVisible({ timeout: 30_000 });
  await waitForApiSettle(page);
}

/** Open a table row by stable row test id (entity uuid from API). */
export async function openTableRowById(
  page: Page,
  tableTestId: string,
  rowId: string,
  detailTestId: string,
  urlPattern?: RegExp,
) {
  const row = page.getByTestId(`${tableTestId}-row-${rowId}`);
  await expect(row).toBeVisible({ timeout: 30_000 });
  await expectGlobalLoaderHidden(page);
  const nav = urlPattern
    ? page.waitForURL(urlPattern, { timeout: 45_000 })
    : Promise.resolve();
  await Promise.all([nav, row.click()]);
  await expectGlobalLoaderHidden(page);
  await expect(page.getByTestId(detailTestId)).toBeVisible({ timeout: 30_000 });
  await waitForApiSettle(page);
}

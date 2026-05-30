import { expect, type Page } from "@playwright/test";
import type { NetworkCollector } from "../network";
import { assertNoCriticalNetworkFailures } from "../network";
import { waitForApiSettle } from "../network";
import { searchDataTable } from "../page";

export async function assertNoStuckLoaders(page: Page) {
  await expect(page.getByTestId("global-loader")).toBeHidden({ timeout: 30_000 });
}

export async function assertRecordInTable(
  page: Page,
  tableTestId: string,
  searchText: string,
) {
  await searchDataTable(page, searchText, tableTestId);
  const row = page.locator(`[data-testid^="${tableTestId}-row-"]`).filter({ hasText: searchText });
  await expect(row.first()).toBeVisible({ timeout: 45_000 });
}

export async function assertDetailShowsText(
  page: Page,
  detailTestId: string,
  text: string | RegExp,
) {
  const root = page.getByTestId(detailTestId);
  await expect(root).toBeVisible({ timeout: 20_000 });
  await expect(root.getByText(text).first()).toBeVisible({ timeout: 15_000 });
}

export function assertDiagnosticsClean(
  diagnostics: NetworkCollector,
  options: { allowStatuses?: number[] } = {},
) {
  assertNoCriticalNetworkFailures(diagnostics, options.allowStatuses ?? []);
  const noise = [
    "favicon",
    "chrome-extension",
    "Failed to load resource",
    "leaflet",
    "ResizeObserver",
  ];
  const criticalConsole = diagnostics.consoleErrors.filter(
    (line) => !noise.some((n) => line.includes(n)),
  );
  if (criticalConsole.length > 0) {
    throw new Error(`Console errors during test:\n${criticalConsole.join("\n")}`);
  }
}

export async function refreshAndAssertDetail(
  page: Page,
  detailTestId: string,
  refreshTestId: string | null,
  text: string | RegExp,
) {
  if (refreshTestId?.includes("refresh")) {
    const refresh = page.getByTestId(refreshTestId);
    if (await refresh.isVisible()) {
      await refresh.click();
      await waitForApiSettle(page);
      await assertDetailShowsText(page, detailTestId, text);
      return;
    }
  }

  await page.reload({ waitUntil: "load" });
  await expect(page.getByTestId(detailTestId)).toBeVisible({ timeout: 30_000 });
  await waitForApiSettle(page);
  await assertDetailShowsText(page, detailTestId, text);
}

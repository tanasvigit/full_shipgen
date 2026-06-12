import { expect, type Page, type Response } from "@playwright/test";
import { gotoRoute } from "../navigation";
import { waitForApiSettle } from "../network";

export type FleetopsResource =
  | "orders"
  | "drivers"
  | "vehicles"
  | "places"
  | "fleets"
  | "contacts"
  | "vendors"
  | "customers";

const RESOURCE_SEGMENT: Record<FleetopsResource, string> = {
  orders: "orders",
  drivers: "drivers",
  vehicles: "vehicles",
  places: "places",
  fleets: "fleets",
  contacts: "contacts",
  vendors: "vendors",
  customers: "customers",
};

export function isFleetopsWriteResponse(
  res: Response,
  resource: FleetopsResource,
  methods: Array<"POST" | "PATCH" | "PUT"> = ["POST", "PATCH", "PUT"],
): boolean {
  const method = res.request().method().toUpperCase();
  if (!methods.includes(method as "POST" | "PATCH" | "PUT")) return false;
  const url = res.url();
  const segment = RESOURCE_SEGMENT[resource];
  const hasResource = new RegExp(`/${segment}(/|$|\\?)`).test(url);
  if (!hasResource) return false;
  const status = res.status();
  return status >= 200 && status < 300;
}

export async function gotoFleetopsList(
  page: Page,
  path: string,
  pageTestId: string,
) {
  await gotoRoute(page, path, { pageTestId });
  await waitForApiSettle(page);
}

/** Wait for a successful FleetOps write (POST/PATCH/PUT) on a resource. */
export function waitForFleetopsWrite(
  page: Page,
  resource: FleetopsResource,
  methods: Array<"POST" | "PATCH" | "PUT"> = ["POST"],
): Promise<Response> {
  return page.waitForResponse(
    (res) => isFleetopsWriteResponse(res, resource, methods),
    { timeout: 60_000 },
  );
}

/** Radix Select — pick first real option (skips "— None —" and disabled placeholders). */
export async function selectFirstEntityOption(
  page: Page,
  testId: string,
): Promise<boolean> {
  const trigger = page.getByTestId(`${testId}-trigger`);
  if (!(await trigger.isVisible())) return false;
  await trigger.click();
  const options = page.getByRole("option");
  const count = await options.count();
  for (let i = 0; i < count; i++) {
    const opt = options.nth(i);
    const text = (await opt.textContent())?.trim() || "";
    const disabled =
      (await opt.getAttribute("data-disabled")) != null ||
      (await opt.getAttribute("aria-disabled")) === "true";
    if (disabled) continue;
    if (!text || text.includes("None") || text === "—" || /no options/i.test(text)) continue;
    await opt.click();
    return true;
  }
  await page.keyboard.press("Escape");
  return false;
}

/** Wait until an EntityAsyncSelect trigger is ready (not loading / empty). */
export async function waitForEntitySelectReady(page: Page, testId: string, timeout = 30_000) {
  const trigger = page.getByTestId(`${testId}-trigger`);
  await expect(trigger).toBeVisible({ timeout });
  await expect(trigger).not.toContainText(/loading/i, { timeout });
  await trigger.click();
  const listbox = page.getByRole("listbox").last();
  await expect(listbox).toBeVisible({ timeout });
  const options = listbox.getByRole("option");
  const count = await options.count();
  let enabledCount = 0;
  for (let i = 0; i < count; i++) {
    const opt = options.nth(i);
    if ((await opt.getAttribute("data-disabled")) != null) continue;
    const text = (await opt.textContent()) || "";
    if (/no options/i.test(text) || text.includes("None")) continue;
    enabledCount += 1;
  }
  expect(enabledCount, `${testId} should expose selectable options`).toBeGreaterThan(0);
  await page.keyboard.press("Escape");
}

export async function selectRadixOption(
  page: Page,
  triggerTestId: string,
  optionLabel: string | RegExp,
) {
  await page.getByTestId(triggerTestId).click();
  await page.getByRole("option", { name: optionLabel }).click();
}

/**
 * Submit FleetOps modal — success = dialog closes without error banner.
 * Optionally asserts a matching API write when the client emits one.
 */
export async function submitFleetOpsDialog(
  page: Page,
  dialogTestId: string,
  options: {
    resource?: FleetopsResource;
    methods?: Array<"POST" | "PATCH" | "PUT">;
    requireApi?: boolean;
  } = {},
): Promise<Response | null> {
  const { resource, methods = ["POST", "PATCH", "PUT"], requireApi = false } = options;
  const dialog = page.getByTestId(dialogTestId);
  const errorEl = page.getByTestId(`${dialogTestId}-error`);

  const responsePromise = resource
    ? waitForFleetopsWrite(page, resource, methods).catch(() => null)
    : Promise.resolve(null);

  await page.getByTestId(`${dialogTestId}-submit`).click();

  const failed = await errorEl
    .isVisible({ timeout: 8_000 })
    .catch(() => false);
  if (failed) {
    const msg = (await errorEl.textContent())?.trim() || "Unknown API error";
    throw new Error(`FleetOps form submission failed: ${msg.slice(0, 800)}`);
  }

  await expect(dialog).toBeHidden({ timeout: 60_000 });

  const response = await responsePromise;
  if (requireApi && resource && !response) {
    throw new Error(`Expected ${methods.join("|")} ${resource} API response but none matched`);
  }

  await expectGlobalLoaderHidden(page);
  await waitForApiSettle(page);
  return response;
}

export async function expectToastSuccess(page: Page, pattern: RegExp) {
  const toast = page.locator("[data-sonner-toast]").filter({ hasText: pattern }).first();
  await expect(toast).toBeVisible({ timeout: 15_000 });
}

export async function expectGlobalLoaderHidden(page: Page) {
  const loader = page.getByTestId("global-loader");
  await expect(loader).toBeHidden({ timeout: 45_000 });
}

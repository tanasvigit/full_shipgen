import { expect, type Page, type Response } from "@playwright/test";
import { attachDiagnostics, assertNoCriticalNetworkFailures, waitForApiSettle, type NetworkCollector } from "../network";
import { gotoRoute, gotoViaSidebar } from "../navigation";
import { assertDiagnosticsClean } from "./assertions";
import { expectGlobalLoaderHidden } from "./workflow";
import { expectDataTableReady, openFirstDetailFromTable } from "../page";

export type StabilizationDiagnostics = NetworkCollector & {
  pageErrors: string[];
  unhandledRejections: string[];
  apiCalls: string[];
};

const CONSOLE_NOISE = [
  "leaflet",
  "ResizeObserver",
  "favicon",
  "chrome-extension",
  "[fleetops-realtime]",
  "Socket unavailable",
  "Failed to load resource",
  "Bad Request",
  "status of 400",
  "Function components cannot be given refs",
  "React.forwardRef",
];

const PAGE_ERROR_NOISE = ["_leaflet_pos", "leaflet"];

const FLEET_API =
  /\/int\/v1\/|\/fleet-ops\/|\/orders(\/|$|\?)|\/drivers(\/|$|\?)|\/routes(\/|$|\?)|\/service_rates|\/schedule/i;

export function attachStabilizationDiagnostics(page: Page): StabilizationDiagnostics {
  const collector = attachDiagnostics(page) as StabilizationDiagnostics;
  collector.pageErrors = [];
  collector.unhandledRejections = [];
  collector.apiCalls = [];

  page.on("pageerror", (err) => {
    collector.pageErrors.push(err.message || String(err));
  });

  page.on("request", (req) => {
    if (FLEET_API.test(req.url())) {
      collector.apiCalls.push(`${req.method()} ${req.url()}`);
    }
  });

  return collector;
}

export async function installUnhandledRejectionProbe(page: Page) {
  await page.addInitScript(() => {
    (window as unknown as { __e2eUnhandled?: string[] }).__e2eUnhandled = [];
    window.addEventListener("unhandledrejection", (e) => {
      const list = (window as unknown as { __e2eUnhandled: string[] }).__e2eUnhandled;
      list.push(String(e.reason ?? "unhandled rejection"));
    });
  });
}

export async function collectUnhandledRejections(page: Page): Promise<string[]> {
  return page.evaluate(() => (window as unknown as { __e2eUnhandled?: string[] }).__e2eUnhandled ?? []);
}

export function assertStabilizationClean(
  diagnostics: StabilizationDiagnostics,
  options: { allowStatuses?: number[]; allowConsole?: RegExp[] } = {},
) {
  assertNoCriticalNetworkFailures(diagnostics, options.allowStatuses ?? []);

  const allowConsole = options.allowConsole ?? [];
  const consoleErrors = diagnostics.consoleErrors.filter(
    (line) =>
      !CONSOLE_NOISE.some((n) => line.includes(n)) &&
      !allowConsole.some((re) => re.test(line)),
  );
  if (consoleErrors.length > 0) {
    throw new Error(`Console errors:\n${consoleErrors.join("\n")}`);
  }

  const pageErrors = diagnostics.pageErrors.filter(
    (line) => !PAGE_ERROR_NOISE.some((n) => line.includes(n)),
  );
  if (pageErrors.length > 0) {
    throw new Error(`Page errors:\n${pageErrors.join("\n")}`);
  }
}

export async function assertNoUnhandledRejections(page: Page) {
  const rejections = await collectUnhandledRejections(page);
  if (rejections.length > 0) {
    throw new Error(`Unhandled promise rejections:\n${rejections.join("\n")}`);
  }
}

export async function assertStabilizationSuiteClean(page: Page, diagnostics: StabilizationDiagnostics) {
  assertStabilizationClean(diagnostics);
  await assertNoUnhandledRejections(page);
}

export async function gotoOrdersList(page: Page) {
  await gotoRoute(page, "/fleet-ops/operations/orders", { pageTestId: "orders-list-page" });
  await expect(page.getByTestId("orders-view-table")).toBeVisible();
  await expectDataTableReady(page, "orders-table");
}

export async function expectOrdersUrlParams(page: Page, expected: Record<string, string | undefined>) {
  const url = new URL(page.url());
  for (const [key, value] of Object.entries(expected)) {
    if (value === undefined) {
      expect(url.searchParams.get(key)).toBeNull();
    } else {
      expect(url.searchParams.get(key)).toBe(value);
    }
  }
}

export async function reloadAndPreserveOrdersFilters(page: Page, expected: Record<string, string>) {
  await page.reload({ waitUntil: "load" });
  await expect(page.getByTestId("orders-list-page")).toBeVisible({ timeout: 45_000 });
  await expectDataTableReady(page, "orders-table");
  await expectOrdersUrlParams(page, expected);
}

/** Orders table pagination (client-side, same pattern as drivers/vehicles). */
export async function paginateOrdersServerTable(page: Page) {
  const next = page.getByTestId("orders-table-next");
  if (!(await next.isVisible()) || !(await next.isEnabled())) return;

  const footer = page.locator('[data-testid="orders-table"]').getByText(/^Page \d+ \/ \d+$/);
  const beforeText = (await footer.textContent()) || "";

  await next.click();

  await expect
    .poll(async () => (await footer.textContent()) || "", { timeout: 10_000 })
    .not.toBe(beforeText);

  const prev = page.getByTestId("orders-table-prev");
  if (await prev.isEnabled()) {
    await prev.click();
  }
}

/** Client-side orders search (same UX as drivers/vehicles DataTable). */
export async function searchOrdersClientTable(page: Page, term: string) {
  const search = page.getByTestId("orders-table-search");
  await expect(search).toBeVisible();
  await expect(search).toBeEnabled();
  await search.fill(term);
  await expect(search).toHaveValue(term);

  await search.fill("");
  await expect(search).toHaveValue("");
}

function isOrdersListGetUrl(url: string) {
  const path = url.replace(/\?.*$/, "");
  return /\/orders(\?|$)/i.test(url) && !/\/orders\/[^/?]+$/i.test(path);
}

/** @deprecated Use searchOrdersClientTable — orders search matches drivers/vehicles (client-side). */
export async function searchOrdersServerTable(page: Page, term: string) {
  await searchOrdersClientTable(page, term);
}

export function waitForOrdersListApi(page: Page, options: { method?: string } = {}): Promise<Response> {
  const method = (options.method ?? "GET").toUpperCase();
  return page.waitForResponse(
    (res) => {
      const url = res.url();
      return (
        method === res.request().method().toUpperCase() &&
        /\/orders(\?|$|\/)/i.test(url) &&
        !/\/orders\/[^/?]+/.test(url.replace(/\?.*$/, "")) &&
        res.status() >= 200 &&
        res.status() < 400
      );
    },
    { timeout: 60_000 },
  );
}

export async function selectFirstOrderCheckbox(page: Page) {
  const checkbox = page.locator('[data-testid^="orders-table-select-"]').first();
  if (!(await checkbox.isVisible())) return false;
  await checkbox.check();
  await expect(page.getByTestId("orders-bulk-toolbar")).toBeVisible();
  return true;
}

export async function openFirstOrderDetail(page: Page) {
  return openFirstDetailFromTable(page, "orders-table", "order-detail-page");
}

export async function interceptUsersMePermissions(page: Page, permissions: string[]) {
  await page.route("**/users/me**", async (route) => {
    try {
      const response = await route.fetch();
      const json = await response.json();
      const user = json.user ?? json;
      const next = {
        ...json,
        user: { ...user, permissions },
      };
      await route.fulfill({
        status: response.status(),
        headers: response.headers(),
        contentType: "application/json",
        body: JSON.stringify(next),
      });
    } catch (error) {
      const message = String(error || "");
      if (message.includes("Target page, context or browser has been closed")) return;
      throw error;
    }
  });
}

function stripUserPermissionSources<T extends Record<string, unknown>>(user: T): T {
  const role = user.role;
  const nextRole =
    role && typeof role === "object"
      ? { ...role, permissions: [], policies: [] }
      : role;

  const policies = Array.isArray(user.policies)
    ? user.policies.map((policy) =>
        policy && typeof policy === "object" ? { ...policy, permissions: [] } : policy,
      )
    : user.policies;

  return {
    ...user,
    permissions: [],
    role: nextRole,
    policies,
    is_admin: false,
    type: "user",
  };
}

export async function interceptUsersMeEmptyPermissions(page: Page) {
  await page.route("**/users/me**", async (route) => {
    try {
      const response = await route.fetch();
      const json = await response.json();
      const user = json.user ?? json;
      const next = {
        ...json,
        user: stripUserPermissionSources({ ...user, permissions: [] }),
      };
      await route.fulfill({
        status: response.status(),
        headers: response.headers(),
        contentType: "application/json",
        body: JSON.stringify(next),
      });
    } catch (error) {
      const message = String(error || "");
      if (message.includes("Target page, context or browser has been closed")) return;
      throw error;
    }
  });
}

export async function clearUsersMeIntercept(page: Page) {
  await page.unroute("**/users/me**");
}

export async function navigateFleetOpsSidebar(page: Page, slug: string, path: string, pageTestId: string) {
  await gotoOrdersList(page);
  await gotoViaSidebar(page, slug, path);
  await expect(page.getByTestId(pageTestId)).toBeVisible({ timeout: 45_000 });
  await waitForApiSettle(page);
}

export async function assertNoRapidDuplicateListFetches(page: Page, action: () => Promise<void>) {
  const urls: string[] = [];
  const handler = (res: Response) => {
    if (res.request().method() === "GET" && /\/orders(\?|$)/i.test(res.url()) && res.status() < 400) {
      urls.push(res.url());
    }
  };
  page.on("response", handler);
  await action();
  await waitForApiSettle(page);
  page.off("response", handler);
  const burst = urls.filter((u, i) => urls.indexOf(u) !== i);
  if (burst.length > 4) {
    throw new Error(`Possible duplicate orders list fetches (${burst.length} repeats)`);
  }
}

export async function runViewportMatrix(page: Page, fn: (label: string) => Promise<void>) {
  const sizes = [
    { label: "mobile", width: 390, height: 844 },
    { label: "tablet", width: 768, height: 1024 },
    { label: "desktop", width: 1440, height: 900 },
  ];
  for (const { label, width, height } of sizes) {
    await page.setViewportSize({ width, height });
    await fn(label);
    await expectGlobalLoaderHidden(page);
  }
}

export async function mockOrdersListRefresh(page: Page, mutate?: (body: unknown) => unknown): Promise<() => number> {
  let hit = 0;
  await page.route("**/orders?**", async (route) => {
    if (route.request().method() !== "GET") {
      await route.continue();
      return;
    }
    hit += 1;
    const response = await route.fetch();
    const json = await response.json();
    const body = mutate ? mutate(json) : json;
    await route.fulfill({
      status: response.status(),
      headers: response.headers(),
      contentType: "application/json",
      body: JSON.stringify(body),
    });
  });
  return () => hit;
}

export const FLEETOPS_DAY1_ROUTES = [
  { slug: "orders", path: "/fleet-ops/operations/orders", testId: "orders-list-page" },
  { slug: "routes", path: "/fleet-ops/operations/routes", testId: "routes-list-page" },
  { slug: "schedule", path: "/fleet-ops/operations/schedule", testId: "schedule-planner-page" },
  { slug: "service-rates", path: "/fleet-ops/operations/service-rates", testId: "service-rates-list-page" },
  { slug: "orchestrator", path: "/fleet-ops/operations/orchestrator", testId: "orchestrator-page" },
] as const;

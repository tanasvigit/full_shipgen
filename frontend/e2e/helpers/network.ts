import type { Page, Response } from "@playwright/test";
import { sel } from "./selectors";

export type NetworkCollector = {
  failures: string[];
  consoleErrors: string[];
};

export function attachDiagnostics(page: Page): NetworkCollector {
  const collector: NetworkCollector = { failures: [], consoleErrors: [] };

  const consoleNoise = ["leaflet", "ResizeObserver", "favicon", "chrome-extension"];

  page.on("console", (msg) => {
    if (msg.type() === "error") {
      const text = msg.text();
      if (!consoleNoise.some((n) => text.includes(n))) {
        collector.consoleErrors.push(text);
      }
    }
  });

  page.on("response", (response: Response) => {
    const url = response.url();
    const status = response.status();
    const isFleetApi =
      url.includes("/int/v1/") ||
      url.includes("/storefront/") ||
      url.includes("/ledger/") ||
      url.includes("/pallet/") ||
      url.includes("/registry/") ||
      /\/(orders|drivers|vehicles|places|fleets|contacts|vendors|order-configs)(\/|$|\?)/.test(url);
    if (!isFleetApi) {
      return;
    }
    if (status >= 400) {
      const isSettingsEndpoint = /\/int\/v1\/settings(\/|$|\?)/i.test(url);
      const optionalProbe =
        (isSettingsEndpoint && (status === 400 || status === 404 || status === 405 || status === 500)) ||
        ((/\/next-activity|\/eta(\/|$|\?)/.test(url) ||
          /\/health(\/|$|\?)/i.test(url) ||
          /\/order_configs|\/service_areas(\/|$|\?)/i.test(url) ||
          /\/routes(\/|$|\?)/i.test(url) ||
          /\/(vendors|integrated-vendors|integrated_vendors|contacts|customers|fuel-reports|fuel_reports|issues)(\/|$|\?)/i.test(
            url,
          ) ||
          /\/(telematics|devices|sensors|device-events|device_events)(\/|$|\?)/i.test(url) ||
          /\/(maintenance-schedules|maintenance_schedules|maintenances|work-orders|work_orders|equipment|parts)(\/|$|\?)/i.test(
            url,
          ) ||
          /\/int\/v1\/?$/i.test(url) ||
          /\/service_rates|\/service-rates/i.test(url) ||
          /\/orchestrat/i.test(url) ||
          /\/orders\/[^/]+\/(dispatch|start|cancel|complete|update-activity|updateActivity)/i.test(
            url,
          ) ||
          /\/orders\/(dispatch|start|cancel|complete)(\/|$|\?)/i.test(url)) &&
          (status === 400 || status === 404 || status === 405));
      if (!optionalProbe) {
        collector.failures.push(`${status} ${response.request().method()} ${url}`);
      }
    }
  });

  return collector;
}

export function assertNoCriticalNetworkFailures(collector: NetworkCollector, allowStatuses: number[] = []) {
  const critical = collector.failures.filter((line) => {
    const status = Number.parseInt(line.split(" ")[0], 10);
    return !allowStatuses.includes(status);
  });
  if (critical.length > 0) {
    throw new Error(`Unexpected API failures:\n${critical.join("\n")}`);
  }
}

export async function waitForApiSettle(page: Page, options: { timeout?: number } = {}) {
  const timeout = options.timeout ?? 15_000;
  await page.waitForLoadState("networkidle", { timeout }).catch(() => {
    /* SPA may keep sockets open — fall through */
  });
  await page.locator(sel.pageHeader).waitFor({ state: "visible", timeout: 10_000 }).catch(() => {});
}

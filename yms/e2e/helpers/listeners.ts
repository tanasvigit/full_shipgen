import type { Page, Request, Response } from "@playwright/test";
import { getAuditState } from "./audit-state";

export interface PageListeners {
  currentRoute: string;
  consoleCount: () => number;
  detach: () => void;
}

export function attachPageListeners(page: Page, initialRoute = "/"): PageListeners {
  const audit = getAuditState();
  let route = initialRoute;
  let sessionConsoleCount = 0;

  const onConsole = (msg: { type: () => string; text: () => string; location: () => { url?: string; lineNumber?: number; columnNumber?: number } }) => {
    const type = msg.type();
    if (type === "error" || type === "warning") {
      sessionConsoleCount += 1;
      const loc = msg.location();
      const location =
        loc?.url != null
          ? `${loc.url}:${loc.lineNumber ?? "?"}:${loc.columnNumber ?? "?"}`
          : undefined;
      audit.consoleErrors.push({
        route,
        type,
        text: msg.text(),
        location,
      });
    }
  };

  const onPageError = (error: Error) => {
    audit.runtimeExceptions.push({
      route,
      message: error.message,
      stack: error.stack,
    });
  };

  const onResponse = (response: Response) => {
    const url = response.url();
    const status = response.status();
    const method = response.request().method();
    if (!isTrackedApi(url)) return;
    if (status >= 400) {
      audit.apiFailures.push({
        url,
        method,
        status,
        route,
      });
    }
  };

  const onRequestFailed = (request: Request) => {
    const url = request.url();
    if (!isTrackedApi(url)) return;
    const failure = request.failure();
    audit.apiFailures.push({
      url,
      method: request.method(),
      status: 0,
      route: `${route} (${failure?.errorText || "aborted"})`,
    });
  };

  page.on("console", onConsole);
  page.on("pageerror", onPageError);
  page.on("response", onResponse);
  page.on("requestfailed", onRequestFailed);

  return {
    get currentRoute() {
      return route;
    },
    set currentRoute(v: string) {
      route = v;
    },
    consoleCount: () => sessionConsoleCount,
    detach: () => {
      page.off("console", onConsole);
      page.off("pageerror", onPageError);
      page.off("response", onResponse);
      page.off("requestfailed", onRequestFailed);
    },
  };
}

function isTrackedApi(url: string): boolean {
  return (
    url.includes("/api/") ||
    url.includes(":8001/") ||
    url.includes("localhost:8001")
  );
}

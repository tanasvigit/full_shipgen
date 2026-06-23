import type { Href, Router } from "expo-router";
import type { YardModuleLink } from "@/src/lib/yardModules";

export type YardNavOrigin = "more" | "tab";

/** Screens registered as tabs but hidden from the bottom bar. */
export const YARD_HIDDEN_TAB_KEYS = new Set([
  "detention",
  "vehicles",
  "yard-map",
  "loading-ops",
  "labor",
  "equipment",
]);

/** Primary tab routes — use navigate() when not in the More flow. */
export const YARD_PRIMARY_TAB_KEYS = new Set([
  "overview",
  "gate",
  "appointments",
  "queue",
  "docks",
  "search",
  "alerts",
  "more",
  "profile",
  "ops",
]);

/** Never show the More-flow module bar on these screens. */
export const YARD_NO_MODULE_BAR_KEYS = new Set(["overview", "search", "alerts", "profile", "more"]);

export const YARD_MORE_HUB_ROUTE = "/(yard)/more" as const;

export const YARD_MODULE_SHORT_LABELS: Record<string, string> = {
  overview: "Overview",
  alerts: "Alerts",
  search: "Search",
  gate: "Gate",
  appointments: "Appts",
  queue: "Queue",
  "loading-ops": "Loading",
  vehicles: "Vehicles",
  "yard-map": "Yard map",
  docks: "Docks",
  labor: "Labor",
  equipment: "Equip",
  detention: "Detention",
  more: "More",
};

export function yardModuleShortLabel(key: string, fallback?: string) {
  return YARD_MODULE_SHORT_LABELS[key] ?? fallback ?? key;
}

export function activeYardModuleKey(pathname: string): string | null {
  const normalized = pathname.replace(/^\//, "");
  const match = normalized.match(/(?:\(yard\)\/)?([^/?]+)/);
  return match?.[1] ?? null;
}

export function resolveYardNavOrigin(pathname: string, fromParam?: string | string[]): YardNavOrigin {
  if (fromParam === "more" || (Array.isArray(fromParam) && fromParam.includes("more"))) {
    return "more";
  }
  if (activeYardModuleKey(pathname) === "more") return "more";
  return "tab";
}

export function buildYardModuleHref(link: YardModuleLink, origin: YardNavOrigin): Href {
  if (origin === "more") {
    return { pathname: link.href, params: { from: "more" } };
  }
  return link.href;
}

export function shouldShowYardModuleTopBar(pathname: string, inMoreFlow: boolean) {
  if (!inMoreFlow) return false;
  const key = activeYardModuleKey(pathname);
  if (!key || YARD_NO_MODULE_BAR_KEYS.has(key)) return false;
  return true;
}

export function shouldReturnToMoreHub(pathname: string, inMoreFlow: boolean) {
  return shouldShowYardModuleTopBar(pathname, inMoreFlow);
}

export function navigateYardModule(router: Router, link: YardModuleLink, origin: YardNavOrigin) {
  if (link.key === "more") {
    returnToMoreHub(router);
    return;
  }

  const href = buildYardModuleHref(link, origin);

  if (origin === "more") {
    router.push(href);
    return;
  }

  if (YARD_PRIMARY_TAB_KEYS.has(link.key)) {
    router.navigate(href);
    return;
  }

  router.push(href);
}

export function returnToMoreHub(router: Router) {
  router.navigate(YARD_MORE_HUB_ROUTE);
}

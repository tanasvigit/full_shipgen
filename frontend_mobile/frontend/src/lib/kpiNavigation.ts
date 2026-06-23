import type { Href } from "expo-router";
import type { DockFilter } from "@/src/lib/dockActions";
import type { GatePipelineTab, GateScreenMode } from "@/src/lib/gateActions";
import type { VehicleMonitorCategory } from "@/src/lib/vehicleMonitorActions";

export type OverviewKpiKey =
  | "in_yard"
  | "avg_wait"
  | "docks_busy"
  | "attention"
  | "exited_today"
  | "loading"
  | "sla"
  | "yard_util";

const OVERVIEW_KPI_TARGETS: Record<OverviewKpiKey, { screen: string; href: Href }> = {
  in_yard: { screen: "vehicles", href: { pathname: "/(yard)/vehicles", params: { category: "inYard" } } },
  avg_wait: { screen: "queue", href: "/(yard)/queue" },
  docks_busy: { screen: "docks", href: { pathname: "/(yard)/docks", params: { filter: "active" } } },
  attention: { screen: "alerts", href: "/(yard)/alerts" },
  exited_today: { screen: "gate", href: { pathname: "/(yard)/gate", params: { mode: "entry", tab: "EXITED" } } },
  loading: { screen: "loading-ops", href: "/(yard)/loading-ops" },
  sla: { screen: "alerts", href: "/(yard)/alerts" },
  yard_util: { screen: "yard-map", href: "/(yard)/yard-map" },
};

export function overviewKpiNavigation(
  key: string,
  canAccessScreen: (screen: string) => boolean,
): Href | null {
  const target = OVERVIEW_KPI_TARGETS[key as OverviewKpiKey];
  if (!target) return null;
  if (!canAccessScreen(target.screen)) return null;
  return target.href;
}

export type GateKpiKey =
  | "approaching"
  | "arrived"
  | "checkedIn"
  | "waiting"
  | "exitHolding"
  | "exitedToday";

export function gateKpiSelection(key: GateKpiKey): { mode: GateScreenMode; tab: GatePipelineTab } {
  switch (key) {
    case "approaching":
      return { mode: "entry", tab: "APPROACHING" };
    case "arrived":
      return { mode: "entry", tab: "ARRIVED" };
    case "checkedIn":
      return { mode: "entry", tab: "CHECKED_IN" };
    case "waiting":
      return { mode: "entry", tab: "WAITING" };
    case "exitHolding":
      return { mode: "exit", tab: "ALL" };
    case "exitedToday":
      return { mode: "entry", tab: "EXITED" };
    default:
      return { mode: "entry", tab: "ALL" };
  }
}

export type AppointmentKpiKey = "total" | "scheduled" | "delayed";
export type DetentionKpiKey = "records" | "disputed" | "today";
export type QueueSummaryKpiKey = "inQueue" | "ready";
export type LoadingOpsKpiKey = "active" | "loading" | "ready" | "exceptions";
export type DockSummaryKpiKey = "available" | "occupied" | "loading" | "delayed";
export type VehicleSummaryKpiKey = "inYard" | "waiting" | "loading" | "exitHolding";
export type LaborSummaryKpiKey = "total" | "onDuty" | "available" | "assigned";
export type EquipmentSummaryKpiKey = "total" | "idle" | "assigned" | "inUse";

export function vehicleSummaryCategory(key: VehicleSummaryKpiKey): VehicleMonitorCategory {
  return key;
}

export function dockSummaryFilter(key: DockSummaryKpiKey): DockFilter {
  switch (key) {
    case "available":
      return "available";
    case "occupied":
      return "active";
    case "loading":
      return "loading";
    case "delayed":
      return "delayed";
    default:
      return "all";
  }
}

export function dockChipNavigation(
  label: string,
  canAccessScreen: (screen: string) => boolean,
): Href | null {
  const normalized = label.trim().toLowerCase();
  if (!canAccessScreen("docks")) return null;
  if (normalized === "available") {
    return { pathname: "/(yard)/docks", params: { filter: "available" } };
  }
  if (normalized === "occupied") {
    return { pathname: "/(yard)/docks", params: { filter: "active" } };
  }
  if (normalized === "delayed") {
    return { pathname: "/(yard)/docks", params: { filter: "delayed" } };
  }
  return null;
}

export function laborSummaryStatus(key: LaborSummaryKpiKey) {
  switch (key) {
    case "onDuty":
      return "ON_DUTY" as const;
    case "available":
      return "AVAILABLE" as const;
    case "assigned":
      return "ASSIGNED" as const;
    default:
      return "ALL" as const;
  }
}

export function equipmentSummaryStatus(key: EquipmentSummaryKpiKey) {
  switch (key) {
    case "idle":
      return "IDLE" as const;
    case "assigned":
      return "ASSIGNED" as const;
    case "inUse":
      return "IN_USE" as const;
    default:
      return "ALL" as const;
  }
}

export function loadingOpsKpiFocus(
  key: LoadingOpsKpiKey,
): "all" | "loading" | "ready" | "exceptions" {
  switch (key) {
    case "loading":
      return "loading";
    case "ready":
      return "ready";
    case "exceptions":
      return "exceptions";
    default:
      return "all";
  }
}

export function detentionKpiFilter(key: DetentionKpiKey): "all" | "disputed" | "today" {
  switch (key) {
    case "disputed":
      return "disputed";
    case "today":
      return "today";
    default:
      return "all";
  }
}

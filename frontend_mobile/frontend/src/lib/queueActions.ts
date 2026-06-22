import type { QueueEntryRow } from "@/src/services/queueService";
import { YMS_PERMISSIONS } from "@/src/lib/ymsPermissions";
import { canOverrideQueueEntry } from "@/src/lib/queueOverrideActions";

export type DockAvailabilitySummary = {
  available: number;
  occupied: number;
  delayed: number;
  maintenance: number;
  total: number;
};

export function summarizeDockAvailability(
  docks: Array<{ status?: string }>,
): DockAvailabilitySummary {
  const summary: DockAvailabilitySummary = {
    available: 0,
    occupied: 0,
    delayed: 0,
    maintenance: 0,
    total: docks.length,
  };
  docks.forEach((dock) => {
    const status = (dock.status || "").toUpperCase();
    if (status === "AVAILABLE") summary.available += 1;
    else if (status === "OCCUPIED") summary.occupied += 1;
    else if (status === "DELAYED") summary.delayed += 1;
    else if (status === "MAINTENANCE") summary.maintenance += 1;
  });
  return summary;
}

export type QueueActionId = "call" | "assign_dock" | "override";

export type QueueActionDef = {
  id: QueueActionId;
  label: string;
  variant: "primary" | "secondary";
  enabled: boolean;
  reason?: string;
};

function hasPermission(can: (permission: string) => boolean, permission: string) {
  return can("*") || can(permission);
}

export function canCallQueueEntry(entry: Pick<QueueEntryRow, "status" | "displayStatus">) {
  const status = String(entry.status || "").toUpperCase();
  const display = String(entry.displayStatus || "").toUpperCase();
  return (
    ["WAITING", "CHECKED_IN"].includes(status) ||
    ["WAITING", "READY_TO_CALL", "CHECKED_IN"].includes(display)
  );
}

export function canAssignDockToEntry(entry: Pick<QueueEntryRow, "status">) {
  return String(entry.status || "").toUpperCase() === "CALLED";
}

export function resolveQueueActions(
  entry: QueueEntryRow | null,
  can: (permission: string) => boolean,
): QueueActionDef[] {
  if (!entry) return [];

  const callEnabled =
    hasPermission(can, YMS_PERMISSIONS.FLOW_CALL) && canCallQueueEntry(entry);

  const assignEnabled =
    hasPermission(can, YMS_PERMISSIONS.FLOW_ASSIGN_DOCK) && canAssignDockToEntry(entry);

  const overrideEnabled =
    hasPermission(can, YMS_PERMISSIONS.QUEUE_WRITE) &&
    canOverrideQueueEntry(entry.status || entry.displayStatus);

  return [
    {
      id: "call",
      label: "Call in",
      variant: "primary",
      enabled: callEnabled,
      reason: callEnabled ? undefined : "Available when vehicle is waiting to be called",
    },
    {
      id: "assign_dock",
      label: "Assign dock",
      variant: "secondary",
      enabled: assignEnabled,
      reason: assignEnabled ? undefined : "Call the vehicle first, then assign a dock",
    },
    {
      id: "override",
      label: "Override rank",
      variant: "secondary",
      enabled: overrideEnabled,
      reason: overrideEnabled ? undefined : "Override available for active queue entries",
    },
  ];
}

export function filterQueueEntries(
  entries: QueueEntryRow[],
  search: string,
) {
  const query = search.trim().toLowerCase();
  if (!query) return entries;
  return entries.filter((entry) => {
    const haystack = [
      entry.plate,
      entry.transporter,
      entry.bookingRef,
      entry.queueNumber,
      entry.dockCode,
      entry.displayStatus,
      entry.status,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return haystack.includes(query);
  });
}

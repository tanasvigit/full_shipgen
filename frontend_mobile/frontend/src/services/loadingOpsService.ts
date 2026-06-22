import { ymsRequest } from "@/src/lib/ymsApi";
import { ACTIVE_DOCK_QUEUE_STATUSES, fetchDockBoard } from "@/src/services/dockService";
import { parseYmsList } from "@/src/services/queueService";
import { hasQueueModuleAccess } from "@/src/lib/moduleAccess";

export type LoadingOpRow = {
  id: string;
  plate: string;
  transporter: string;
  dockCode: string;
  dockName: string;
  status: string;
  vehicleStatus: string;
  progressPct: number;
  labor?: string | null;
  equipment?: string | null;
  vehicleId?: string | null;
  queueEntryId?: string | null;
  dockId: string;
};

export type LoadingOpsSummary = {
  active: number;
  loading: number;
  ready: number;
  exceptions: number;
};

const ACTIVE_VEHICLE_STATUSES = new Set([
  "CALLED",
  "DOCK_ASSIGNED",
  "RESOURCE_PENDING",
  "READY_FOR_LOADING",
  "LOADING",
]);

export function summarizeLoadingOps(rows: LoadingOpRow[], exceptionCount: number): LoadingOpsSummary {
  return {
    active: rows.length,
    loading: rows.filter((row) => row.status.toUpperCase() === "LOADING" || row.vehicleStatus === "LOADING").length,
    ready: rows.filter((row) =>
      ["READY_FOR_LOADING", "RESOURCE_PENDING", "DOCK_ASSIGNED"].includes(row.status.toUpperCase()),
    ).length,
    exceptions: exceptionCount,
  };
}

export function filterLoadingOpsRows(rows: LoadingOpRow[], search: string) {
  const query = search.trim().toLowerCase();
  if (!query) return rows;
  return rows.filter((row) =>
    [row.plate, row.transporter, row.dockCode, row.status, row.labor, row.equipment]
      .filter(Boolean)
      .join(" ")
      .toLowerCase()
      .includes(query),
  );
}

export async function fetchLoadingOpsBundle(can: (permission: string) => boolean) {
  const includeQueue = hasQueueModuleAccess(can);
  const [dockBundle, exceptionsPayload] = await Promise.all([
    fetchDockBoard({ includeQueue }),
    ymsRequest<unknown>("/loading-operations/exceptions?active_only=true").catch(() => []),
  ]);

  const exceptions = parseYmsList(exceptionsPayload);
  const rows: LoadingOpRow[] = dockBundle.rows
    .filter((row) => row.hasActiveAssignment || row.loadingStatus || row.vehicleId)
    .filter((row) => {
      const status = String(row.loadingStatus || row.vehicleStatus || row.status || "").toUpperCase();
      return ACTIVE_DOCK_QUEUE_STATUSES.has(status) || ACTIVE_VEHICLE_STATUSES.has(status) || row.status === "LOADING";
    })
    .map((row) => ({
      id: row.queueEntryId || row.vehicleId || row.id,
      plate: row.plate || "—",
      transporter: row.transporter || "—",
      dockCode: row.code,
      dockName: row.name,
      status: String(row.loadingStatus || row.status || "—"),
      vehicleStatus: String(row.vehicleStatus || row.loadingStatus || "—"),
      progressPct: row.progressPct,
      labor: row.labor ? `${row.labor.code} · ${row.labor.name}` : null,
      equipment: row.equipment ? `${row.equipment.code} · ${row.equipment.name}` : null,
      vehicleId: row.vehicleId,
      queueEntryId: row.queueEntryId,
      dockId: row.id,
    }));

  return {
    rows,
    summary: summarizeLoadingOps(rows, exceptions.length),
    exceptions,
  };
}

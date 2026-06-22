import { ymsRequest } from "@/src/lib/ymsApi";
import {
  computeVehicleMonitorCounts,
  type VehicleMonitorCounts,
  type VehicleMonitorRow,
} from "@/src/lib/vehicleMonitorActions";
import { parseYmsList } from "@/src/services/queueService";

const ZONE_TYPE_LABELS: Record<string, string> = {
  GATE_IN: "Gate In",
  WAITING_AREA: "Waiting Area",
  STAGING: "Staging",
  LOADING: "Loading",
  UNLOADING: "Unloading",
  EXIT_HOLDING: "Exit Holding",
  GATE_OUT: "Gate Out",
  DOCUMENTATION: "Documentation",
  HAZMAT: "Hazmat",
  COLD_CHAIN: "Cold Chain",
  EMERGENCY_HOLDING: "Emergency Holding",
};

function formatZoneLabel(zone: Record<string, unknown> | undefined) {
  if (!zone) return "—";
  const zoneType = String(zone.zone_type || zone.zoneType || "");
  if (zoneType && ZONE_TYPE_LABELS[zoneType]) return ZONE_TYPE_LABELS[zoneType];
  return String(zone.zone_name || zone.zoneName || zone.zone_code || zone.zoneCode || "—");
}

function formatCategory(ownership?: unknown) {
  const value = String(ownership || "").toLowerCase();
  if (value === "company") return "Company";
  if (value === "contract") return "Contract";
  return "Outside";
}

function mapVehicleMonitorRow(
  vehicle: Record<string, unknown>,
  context: {
    zone?: Record<string, unknown>;
    dockCode?: string | null;
  },
): VehicleMonitorRow {
  return {
    id: String(vehicle.id),
    plate: String(vehicle.vehicle_number || "—"),
    transporter: String(vehicle.transporter_name || "—"),
    driver: String(vehicle.driver_name || "—"),
    status: String(vehicle.status || "—"),
    zone: formatZoneLabel(context.zone),
    dockCode: context.dockCode && context.dockCode !== "—" ? context.dockCode : "—",
    vehicleType: String(vehicle.vehicle_type || "—"),
    category: formatCategory(vehicle.ownership_type),
  };
}

function resolveDockCodeFromQueue(
  queueEntry: Record<string, unknown> | undefined,
  dockById: Map<string, Record<string, unknown>>,
) {
  const fromQueue = queueEntry?.dockCode ?? queueEntry?.dock_code;
  if (fromQueue) return String(fromQueue);

  const dockId = queueEntry?.dockId ?? queueEntry?.dock_id;
  if (dockId) {
    const dock = dockById.get(String(dockId));
    if (dock) return String(dock.dock_code || dock.dockCode || "—");
  }

  return "—";
}

function buildDockCodeByVehicleId(docks: Record<string, unknown>[]) {
  const map = new Map<string, string>();
  for (const dock of docks) {
    const vehicleId = dock.current_vehicle_id ?? dock.currentVehicleId;
    if (!vehicleId) continue;
    map.set(String(vehicleId), String(dock.dock_code || dock.dockCode || "—"));
  }
  return map;
}

export type VehicleMonitorBundle = {
  rows: VehicleMonitorRow[];
  counts: VehicleMonitorCounts;
};

export type VehicleMonitorFetchOptions = {
  includeQueue?: boolean;
  includeDocks?: boolean;
};

export async function fetchVehicleMonitorBundle(
  options?: VehicleMonitorFetchOptions,
): Promise<VehicleMonitorBundle> {
  const includeQueue = options?.includeQueue ?? false;
  const includeDocks = options?.includeDocks ?? false;

  const [vehiclesPayload, zonesPayload, queueBundle, docksPayload] = await Promise.all([
    ymsRequest<unknown>("/vehicles?limit=500"),
    ymsRequest<unknown>("/yard/zones?limit=500"),
    includeQueue
      ? ymsRequest<{ entries?: Record<string, unknown>[] }>("/queue/bundle")
      : Promise.resolve({ entries: [] }),
    includeDocks ? ymsRequest<unknown>("/docks?limit=200") : Promise.resolve([]),
  ]);

  const vehicles = parseYmsList(vehiclesPayload);
  const zones = parseYmsList(zonesPayload);
  const queueEntries = queueBundle.entries ?? [];
  const docks = parseYmsList(docksPayload);

  const zonesById = new Map(zones.map((zone) => [String(zone.id), zone]));
  const dockById = new Map(docks.map((dock) => [String(dock.id), dock]));
  const dockCodeByVehicleId = buildDockCodeByVehicleId(docks);
  const queueByVehicle = new Map<string, Record<string, unknown>>();

  for (const queue of queueEntries) {
    const vehicleId = queue.vehicleId ?? queue.vehicle_id;
    if (!vehicleId) continue;
    queueByVehicle.set(String(vehicleId), queue);
  }

  const rows = vehicles.map((vehicle) => {
    const vehicleId = String(vehicle.id);
    const zoneId = vehicle.current_zone_id ? String(vehicle.current_zone_id) : null;
    const queue = queueByVehicle.get(vehicleId);
    const dockCode = includeQueue
      ? resolveDockCodeFromQueue(queue, dockById)
      : dockCodeByVehicleId.get(vehicleId) || "—";

    return mapVehicleMonitorRow(vehicle, {
      zone: zoneId ? zonesById.get(zoneId) : undefined,
      dockCode,
    });
  });

  return {
    rows: rows.sort((a, b) => a.plate.localeCompare(b.plate, undefined, { numeric: true })),
    counts: computeVehicleMonitorCounts(rows),
  };
}

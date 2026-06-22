import { ymsRequest } from "@/src/lib/ymsApi";
import { parseYmsList } from "@/src/services/queueService";

export type EquipmentRow = {
  id: string;
  code: string;
  name: string;
  type: string;
  status: string;
  operator: string;
  location: string;
  battery?: number | null;
  assignedDockId?: string | null;
};

export type EquipmentSummary = {
  total: number;
  idle: number;
  assigned: number;
  inUse: number;
  maintenance: number;
};

function mapEquipmentRow(row: Record<string, unknown>): EquipmentRow {
  const battery = row.battery_level;
  return {
    id: String(row.id),
    code: String(row.equipment_code || row.equipmentCode || "—"),
    name: String(row.equipment_name || row.equipmentName || "Equipment"),
    type: String(row.equipment_type || row.equipmentType || "—"),
    status: String(row.status || ""),
    operator: String(row.operator_name || "—"),
    location: String(row.current_location || "—"),
    battery: battery === null || battery === undefined ? null : Number(battery),
    assignedDockId: row.assigned_dock_id ? String(row.assigned_dock_id) : null,
  };
}

export function summarizeEquipmentRows(rows: EquipmentRow[]): EquipmentSummary {
  return {
    total: rows.length,
    idle: rows.filter((row) => row.status.toUpperCase() === "IDLE").length,
    assigned: rows.filter((row) => row.status.toUpperCase() === "ASSIGNED").length,
    inUse: rows.filter((row) => row.status.toUpperCase() === "IN_USE").length,
    maintenance: rows.filter((row) => ["MAINTENANCE", "CHARGING", "OUT_OF_SERVICE"].includes(row.status.toUpperCase()))
      .length,
  };
}

export function filterEquipmentRows(rows: EquipmentRow[], search: string, status: string) {
  const query = search.trim().toLowerCase();
  return rows.filter((row) => {
    if (status !== "ALL" && row.status.toUpperCase() !== status) return false;
    if (!query) return true;
    return [row.code, row.name, row.type, row.status, row.operator, row.location]
      .join(" ")
      .toLowerCase()
      .includes(query);
  });
}

export async function fetchEquipmentBundle() {
  const payload = await ymsRequest<unknown>("/equipment?limit=200");
  const rows = parseYmsList(payload)
    .map(mapEquipmentRow)
    .sort((a, b) => a.code.localeCompare(b.code, undefined, { numeric: true }));
  return { rows, summary: summarizeEquipmentRows(rows) };
}

export async function assignEquipmentToDock(dockId: string, equipmentId: string) {
  return ymsRequest<Record<string, unknown>>(`/docks/${dockId}/assign-equipment`, {
    method: "POST",
    body: {
      equipment_id: equipmentId,
      set_in_use: false,
      event_note: "Equipment assigned from mobile equipment module",
      created_by: "mobile-equipment",
    },
  });
}

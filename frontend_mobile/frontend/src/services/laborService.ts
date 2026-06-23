import { ymsRequest } from "@/src/lib/ymsApi";
import { parseYmsList } from "@/src/services/queueService";
import type { LaborFormInput } from "@/src/lib/laborActions";
import { parseLaborMembersCount } from "@/src/lib/laborActions";

export type LaborRow = {
  id: string;
  code: string;
  name: string;
  status: string;
  shift: string;
  shiftStart: string;
  shiftEnd: string;
  members: number;
  available: number;
  assigned: string;
  supervisor: string;
  supervisorPhone: string;
  materialType: string;
  location: string;
  notes?: string | null;
  assignedDockId?: string | null;
};

export type LaborSummary = {
  total: number;
  onDuty: number;
  available: number;
  assigned: number;
};

function mapLaborRow(row: Record<string, unknown>): LaborRow {
  const shiftStart = String(row.shift_start || "");
  const shiftEnd = String(row.shift_end || "");
  return {
    id: String(row.id),
    code: String(row.team_code || row.teamCode || "—"),
    name: String(row.team_name || row.teamName || "Team"),
    status: String(row.status || ""),
    shift: shiftStart && shiftEnd ? `${shiftStart} — ${shiftEnd}` : "—",
    shiftStart,
    shiftEnd,
    members: Number(row.members_count || 0),
    available: Number(row.available_count || 0),
    assigned: String(row.current_assignment || "—"),
    supervisor: String(row.supervisor_name || "—"),
    supervisorPhone: String(row.supervisor_phone || ""),
    materialType: String(row.material_type || row.team_type || "GENERAL"),
    location: String(row.current_location || "—"),
    notes: row.notes ? String(row.notes) : null,
    assignedDockId: row.assigned_dock_id ? String(row.assigned_dock_id) : null,
  };
}

export function summarizeLaborRows(rows: LaborRow[]): LaborSummary {
  return {
    total: rows.length,
    onDuty: rows.filter((row) => ["ON_DUTY", "AVAILABLE", "ASSIGNED"].includes(row.status.toUpperCase())).length,
    available: rows.reduce(
      (sum, row) =>
        sum + (["ON_DUTY", "AVAILABLE", "ASSIGNED"].includes(row.status.toUpperCase()) ? row.available : 0),
      0,
    ),
    assigned: rows.filter((row) => row.status.toUpperCase() === "ASSIGNED").length,
  };
}

export function filterLaborRows(rows: LaborRow[], search: string, status: string) {
  const query = search.trim().toLowerCase();
  return rows.filter((row) => {
    if (status !== "ALL" && row.status.toUpperCase() !== status) return false;
    if (!query) return true;
    return [row.code, row.name, row.status, row.assigned, row.supervisor, row.location]
      .join(" ")
      .toLowerCase()
      .includes(query);
  });
}

export async function fetchLaborBundle() {
  const payload = await ymsRequest<unknown>("/labor?limit=200");
  const rows = parseYmsList(payload)
    .map(mapLaborRow)
    .sort((a, b) => a.code.localeCompare(b.code, undefined, { numeric: true }));
  return { rows, summary: summarizeLaborRows(rows) };
}

export async function assignLaborToDock(dockId: string, laborId: string) {
  return ymsRequest<Record<string, unknown>>(`/docks/${dockId}/assign-labor`, {
    method: "POST",
    body: {
      labor_id: laborId,
      workers_assigned: 1,
      event_note: "Labor assigned from mobile labor module",
      created_by: "mobile-labor",
    },
  });
}

function laborFormBody(form: LaborFormInput) {
  return {
    team_name: form.teamName.trim(),
    supervisor_name: form.supervisorName.trim(),
    supervisor_phone: form.supervisorPhone.trim(),
    shift_start: form.shiftStart.trim(),
    shift_end: form.shiftEnd.trim(),
    members_count: parseLaborMembersCount(form),
    material_type: form.materialType,
    status: form.status,
    notes: form.notes.trim() || null,
    created_by: "mobile-labor",
  };
}

export async function createLaborTeam(form: LaborFormInput) {
  return ymsRequest<Record<string, unknown>>("/labor", {
    method: "POST",
    body: laborFormBody(form),
  });
}

export async function updateLaborTeam(laborId: string, form: LaborFormInput) {
  return ymsRequest<Record<string, unknown>>(`/labor/${laborId}`, {
    method: "PATCH",
    body: laborFormBody(form),
  });
}

export async function deleteLaborTeam(laborId: string) {
  return ymsRequest<void>(`/labor/${laborId}`, { method: "DELETE" });
}

export const LABOR_MATERIAL_TYPES = [
  "GENERAL",
  "BAGS",
  "PALLETS",
  "STEEL",
  "CEMENT",
  "CHEMICALS",
  "HAZMAT",
  "PHARMA",
  "COLD_CHAIN",
  "CONTAINERS",
  "CUSTOM",
] as const;

export const LABOR_STATUSES = [
  "ON_DUTY",
  "OFF_DUTY",
  "ASSIGNED",
  "AVAILABLE",
  "BREAK",
  "UNAVAILABLE",
] as const;

export const LABOR_CREATE_STATUSES = LABOR_STATUSES.filter((status) => status !== "ASSIGNED");

export type LaborFormInput = {
  teamName: string;
  supervisorName: string;
  supervisorPhone: string;
  shiftStart: string;
  shiftEnd: string;
  membersCount: string;
  materialType: string;
  status: string;
  notes: string;
};

export const DEFAULT_LABOR_FORM: LaborFormInput = {
  teamName: "",
  supervisorName: "",
  supervisorPhone: "",
  shiftStart: "06:00",
  shiftEnd: "14:00",
  membersCount: "8",
  materialType: "GENERAL",
  status: "ON_DUTY",
  notes: "",
};

function isShiftTime(value: string) {
  return /^\d{1,2}:\d{2}$/.test(value.trim());
}

export function validateLaborForm(form: LaborFormInput): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!form.teamName.trim()) errors.teamName = "Team name is required";
  if (!form.supervisorName.trim()) errors.supervisorName = "Supervisor name is required";
  if (!form.supervisorPhone.trim()) errors.supervisorPhone = "Supervisor phone is required";
  if (!isShiftTime(form.shiftStart)) errors.shiftStart = "Use HH:MM format";
  if (!isShiftTime(form.shiftEnd)) errors.shiftEnd = "Use HH:MM format";
  const members = Number.parseInt(form.membersCount, 10);
  if (!Number.isFinite(members) || members < 1) errors.membersCount = "Member count must be at least 1";
  if (!LABOR_MATERIAL_TYPES.includes(form.materialType as (typeof LABOR_MATERIAL_TYPES)[number])) {
    errors.materialType = "Select a material type";
  }
  if (!LABOR_STATUSES.includes(form.status as (typeof LABOR_STATUSES)[number])) {
    errors.status = "Select a status";
  }
  return errors;
}

export function parseLaborMembersCount(form: LaborFormInput) {
  return Number.parseInt(form.membersCount, 10);
}

export function canDeleteLaborRow(row: { assignedDockId?: string | null; status: string }) {
  if (row.assignedDockId) return false;
  return row.status.toUpperCase() !== "ASSIGNED";
}

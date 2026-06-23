export const EQUIPMENT_TYPES = [
  "FORKLIFT",
  "CRANE",
  "REACH_STACKER",
  "PALLET_JACK",
  "HAND_TRUCK",
  "CONVEYOR",
  "LOADER",
  "STACKER",
  "CUSTOM",
] as const;

export const EQUIPMENT_STATUSES = [
  "IDLE",
  "ASSIGNED",
  "IN_USE",
  "MAINTENANCE",
  "CHARGING",
  "OUT_OF_SERVICE",
] as const;

export const EQUIPMENT_CREATE_STATUSES = EQUIPMENT_STATUSES.filter(
  (status) => !["ASSIGNED", "IN_USE"].includes(status),
);

export type EquipmentFormInput = {
  equipmentName: string;
  equipmentType: string;
  status: string;
  model: string;
  assetNumber: string;
  operatorName: string;
  currentLocation: string;
  batteryLevel: string;
  notes: string;
};

export const DEFAULT_EQUIPMENT_FORM: EquipmentFormInput = {
  equipmentName: "",
  equipmentType: "FORKLIFT",
  status: "IDLE",
  model: "",
  assetNumber: "",
  operatorName: "",
  currentLocation: "",
  batteryLevel: "",
  notes: "",
};

export function parseEquipmentBattery(value: string): number | null | "invalid" {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const battery = Number.parseInt(trimmed, 10);
  if (!Number.isFinite(battery) || battery < 0 || battery > 100) return "invalid";
  return battery;
}

export function validateEquipmentForm(form: EquipmentFormInput): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!form.equipmentName.trim()) errors.equipmentName = "Equipment name is required";
  if (!EQUIPMENT_TYPES.includes(form.equipmentType as (typeof EQUIPMENT_TYPES)[number])) {
    errors.equipmentType = "Select an equipment type";
  }
  if (!EQUIPMENT_STATUSES.includes(form.status as (typeof EQUIPMENT_STATUSES)[number])) {
    errors.status = "Select a status";
  }
  if (parseEquipmentBattery(form.batteryLevel) === "invalid") {
    errors.batteryLevel = "Battery must be 0–100";
  }
  return errors;
}

export function canDeleteEquipmentRow(row: { assignedDockId?: string | null; status: string }) {
  if (row.assignedDockId) return false;
  const status = row.status.toUpperCase();
  return status !== "ASSIGNED" && status !== "IN_USE";
}

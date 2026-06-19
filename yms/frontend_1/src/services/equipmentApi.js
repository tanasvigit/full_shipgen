/**
 * Equipment Management — live backend layer.
 */

import ymsApi from "./ymsApi";
import { safeBundleFetch } from "../utils/safeBundleFetch";
import { notifyYmsDataChanged } from "./gateManagementApi";

export const BATTERY_WARN_PCT = 30;
export const BATTERY_BLOCK_ASSIGN_PCT = 20;

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
];

export const EQUIPMENT_STATUSES = [
  "IDLE",
  "ASSIGNED",
  "IN_USE",
  "MAINTENANCE",
  "CHARGING",
  "OUT_OF_SERVICE",
];

export function formatAssignedSince(iso) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "—";
  }
}

export function mapEquipmentRow(row) {
  const battery = row.battery_level;
  const name = row.equipment_name || row.equipment_code;
  return {
    equipmentId: row.id,
    id: row.equipment_code,
    code: row.equipment_code,
    name,
    type: row.equipment_type,
    model: row.model,
    status: row.status,
    operator: row.operator_name || "—",
    assetNumber: row.asset_number || "—",
    location: row.current_location || "—",
    battery,
    batteryLow: battery !== null && battery !== undefined && battery < BATTERY_WARN_PCT,
    batteryBlocked: battery !== null && battery !== undefined && battery < BATTERY_BLOCK_ASSIGN_PCT,
    assignedDockId: row.assigned_dock_id,
    assignedVehicleId: row.assigned_vehicle_id,
    assignedQueueEntryId: row.assigned_queue_entry_id,
    assignedAppointmentId: row.assigned_appointment_id,
    assignedSince: row.assigned_since,
    assignedSinceLabel: formatAssignedSince(row.assigned_since),
    maintenanceDue: row.maintenance_due,
    remarks: row.notes,
    notes: row.notes,
    raw: row,
  };
}

export function resolveEquipmentLabel(equipmentList, { dockId, vehicleId } = {}) {
  if (!equipmentList?.length) return null;
  const match =
    (dockId && equipmentList.find((e) => e.assigned_dock_id === dockId)) ||
    (vehicleId && equipmentList.find((e) => e.assigned_vehicle_id === vehicleId));
  if (!match) return null;
  const mapped = mapEquipmentRow(match);
  return `${mapped.code} · ${mapped.name}`;
}

export function getEquipmentEvents(events, equipmentId, limit = 20) {
  return events
    .filter((e) => e.equipment_id === equipmentId)
    .sort((a, b) => new Date(b.event_time) - new Date(a.event_time))
    .slice(0, limit);
}

export function computeEquipmentKpis(rows) {
  const withBattery = rows.filter((e) => e.battery !== null && e.battery !== undefined);
  const avgBattery = withBattery.length
    ? Math.round(withBattery.reduce((s, e) => s + e.battery, 0) / withBattery.length)
    : 0;

  return {
    total: rows.length,
    available: rows.filter((e) => e.status === "IDLE").length,
    assigned: rows.filter((e) => e.status === "ASSIGNED").length,
    inUse: rows.filter((e) => e.status === "IN_USE").length,
    charging: rows.filter((e) => e.status === "CHARGING").length,
    maintenance: rows.filter((e) => e.status === "MAINTENANCE").length,
    outOfService: rows.filter((e) => e.status === "OUT_OF_SERVICE").length,
    avgBattery,
  };
}

export async function fetchEquipmentBundle({
  includeAppointments = false,
  includeQueue = false,
} = {}) {
  const queuePromise = safeBundleFetch(
    includeQueue,
    () => ymsApi.listQueueEntries(),
    []
  );
  const appointmentsPromise = safeBundleFetch(
    includeAppointments,
    () => ymsApi.listAppointments(),
    []
  );

  const [equipment, docks, vehicles, events, queue, appointments] = await Promise.all([
    ymsApi.listEquipment(),
    ymsApi.listDocks(),
    ymsApi.listVehicles(),
    ymsApi.listYardEvents(),
    queuePromise,
    appointmentsPromise,
  ]);
  const rows = equipment.map(mapEquipmentRow);
  return { rows, equipment, docks, vehicles, events, queue: queue || [], appointments };
}

async function afterMutation(detail = {}) {
  notifyYmsDataChanged({ source: "equipmentApi", ...detail });
}

export async function createEquipment(payload) {
  const result = await ymsApi.createEquipment({
    ...payload,
    created_by: "equipment-ui",
  });
  await afterMutation();
  return mapEquipmentRow(result);
}

export async function updateEquipment(equipmentId, payload) {
  const result = await ymsApi.updateEquipment(equipmentId, {
    ...payload,
    created_by: "equipment-ui",
    event_note: payload.event_note || "Equipment updated via equipment-ui",
  });
  await afterMutation();
  return mapEquipmentRow(result);
}

export async function deleteEquipment(equipmentId) {
  await ymsApi.deleteEquipment(equipmentId);
  await afterMutation();
}

export async function checkEquipmentReadiness(vehicleId) {
  return ymsApi.checkEquipmentReadiness(vehicleId);
}

export async function assignToDock(equipmentId, dockId, options = {}) {
  const useDockCentric = options.dockCentric !== false;
  const result = useDockCentric
    ? await ymsApi.assignDockEquipment(dockId, {
        equipment_id: equipmentId,
        set_in_use: !!options.setInUse,
        event_note: options.eventNote || "Equipment assigned via dock-centric flow",
        created_by: options.createdBy || "docks-ui",
      })
    : await ymsApi.assignEquipment(equipmentId, {
        dock_id: dockId,
        vehicle_id: options.vehicleId || null,
        queue_entry_id: options.queueEntryId || null,
        appointment_id: options.appointmentId || null,
        set_in_use: !!options.setInUse,
        current_location: options.location,
        event_note: options.eventNote,
        created_by: "equipment-ui",
      });
  await afterMutation({ action: "EQUIPMENT_ASSIGNED", equipmentId, dockId });
  return result;
}

export async function assignToVehicle(equipmentId, vehicleId, options = {}) {
  const result = await ymsApi.assignEquipment(equipmentId, {
    vehicle_id: vehicleId,
    dock_id: options.dockId || null,
    queue_entry_id: options.queueEntryId || null,
    set_in_use: !!options.setInUse,
    current_location: options.location,
    event_note: options.eventNote,
    created_by: "equipment-ui",
  });
  await afterMutation();
  return result;
}

export async function release(equipmentId) {
  const result = await ymsApi.releaseEquipment(equipmentId);
  await afterMutation();
  return result;
}

export async function markInUse(equipmentId) {
  const result = await ymsApi.markEquipmentInUse(equipmentId);
  await afterMutation();
  return result;
}

export async function markIdle(equipmentId) {
  const result = await ymsApi.markEquipmentIdle(equipmentId);
  await afterMutation();
  return result;
}

export async function markMaintenance(equipmentId) {
  const result = await ymsApi.markEquipmentMaintenance(equipmentId);
  await afterMutation();
  return result;
}

export async function markCharging(equipmentId) {
  const result = await ymsApi.markEquipmentCharging(equipmentId);
  await afterMutation();
  return result;
}

export async function completeMaintenance(equipmentId) {
  const result = await ymsApi.completeEquipmentMaintenance(equipmentId);
  await afterMutation();
  return result;
}

export async function updateOperator(equipmentId, operatorName) {
  const result = await ymsApi.updateEquipment(equipmentId, { operator_name: operatorName || null });
  await afterMutation();
  return result;
}

export async function updateLocation(equipmentId, location) {
  const result = await ymsApi.updateEquipment(equipmentId, { current_location: location });
  await afterMutation();
  return result;
}

export async function updateStatus(equipmentId, status, eventNote) {
  const result = await ymsApi.updateEquipmentStatus(equipmentId, { status, event_note: eventNote });
  await afterMutation();
  return result;
}

export default {
  EQUIPMENT_TYPES,
  EQUIPMENT_STATUSES,
  fetchEquipmentBundle,
  mapEquipmentRow,
  resolveEquipmentLabel,
  getEquipmentEvents,
  computeEquipmentKpis,
  createEquipment,
  updateEquipment,
  deleteEquipment,
  checkEquipmentReadiness,
  assignToDock,
  assignToVehicle,
  release,
  markInUse,
  markIdle,
  markMaintenance,
  markCharging,
  completeMaintenance,
  updateOperator,
  updateLocation,
  updateStatus,
};

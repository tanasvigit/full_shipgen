/**
 * Shared assignment context for Dock, Labor, and Equipment drawers.
 */

import { formatAssignedSince } from "../services/docksApi";

export function resolveDockLabel(docks, dockId) {
  if (!dockId) return "—";
  const d = docks?.find((x) => x.id === dockId);
  return d ? `${d.dock_code} · ${d.dock_name}` : dockId;
}

export function resolveVehicleLabel(vehicles, vehicleId) {
  if (!vehicleId) return "—";
  const v = vehicles?.find((x) => x.id === vehicleId);
  return v?.vehicle_number || vehicleId;
}

export function resolveQueueLabel(queueEntries, queueEntryId) {
  if (!queueEntryId) return "—";
  const q = queueEntries?.find((x) => x.id === queueEntryId);
  return q?.queue_number || queueEntryId;
}

export function resolveAppointmentLabel(appointments, appointmentId) {
  if (!appointmentId) return "—";
  const a = appointments?.find((x) => x.id === appointmentId);
  return a?.booking_reference || appointmentId;
}

/**
 * Build unified assignment display from labor/equipment row or dock row.
 */
export function buildAssignmentContext(source, refs = {}) {
  const {
    docks = [],
    vehicles = [],
    queueEntries = [],
    appointments = [],
  } = refs;

  const dockId = source.assignedDockId || source.assigned_dock_id || null;
  const vehicleId = source.assignedVehicleId || source.assigned_vehicle_id || source.currentVehicleId || null;
  const queueEntryId =
    source.assignedQueueEntryId ||
    source.assigned_queue_entry_id ||
    source.queueEntryId ||
    null;
  const appointmentId =
    source.assignedAppointmentId ||
    source.assigned_appointment_id ||
    source.appointmentId ||
    null;
  const assignedSince =
    source.assignedSince || source.assigned_since || source.assignedSinceLabel || null;
  const status = source.status || source.backendStatus || "—";

  return {
    dockId,
    dockLabel: source.dockLabel || resolveDockLabel(docks, dockId),
    vehicleId,
    vehicleLabel: source.vehicleLabel || source.currentVehicle || resolveVehicleLabel(vehicles, vehicleId),
    queueEntryId,
    queueLabel: source.queueLabel || source.queueNumber || resolveQueueLabel(queueEntries, queueEntryId),
    appointmentId,
    appointmentLabel:
      source.appointmentLabel || source.appointmentRef || resolveAppointmentLabel(appointments, appointmentId),
    assignedSince,
    assignedSinceLabel: source.assignedSinceLabel || formatAssignedSince(assignedSince),
    status,
    hasAssignment: !!(dockId || vehicleId || queueEntryId),
  };
}

export default buildAssignmentContext;

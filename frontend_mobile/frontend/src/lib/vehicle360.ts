const JOURNEY_STEPS = [
  "SCHEDULED",
  "ARRIVED",
  "CHECKED_IN",
  "WAITING",
  "CALLED",
  "DOCK_ASSIGNED",
  "RESOURCE_PENDING",
  "READY_FOR_LOADING",
  "LOADING",
  "COMPLETED",
  "EXIT_HOLDING",
  "EXIT_VERIFIED",
  "EXITED",
] as const;

const JOURNEY_LABELS: Record<string, string> = {
  SCHEDULED: "Scheduled",
  ARRIVED: "Arrived",
  CHECKED_IN: "Checked in",
  WAITING: "Waiting",
  CALLED: "Called",
  DOCK_ASSIGNED: "Dock assigned",
  RESOURCE_PENDING: "Resources pending",
  READY_FOR_LOADING: "Ready for loading",
  LOADING: "Loading",
  COMPLETED: "Completed",
  EXIT_HOLDING: "Exit holding",
  EXIT_VERIFIED: "Exit verified",
  EXITED: "Exited",
};

export type VehicleJourneyEvent = {
  id: string;
  time: string;
  type: string;
  note?: string;
};

export type VehicleJourneyStep = {
  key: string;
  label: string;
  done: boolean;
  current: boolean;
};

export type Vehicle360Profile = {
  vehicleId: string;
  plate: string;
  transporter: string;
  driver: string;
  driverPhone?: string;
  status: string;
  currentStage: string;
  zone?: string;
  dockCode?: string;
  dockId?: string | null;
  appointmentId?: string | null;
  appointmentRef?: string;
  queueEntryId?: string | null;
  queueNumber?: string;
  queueStatus?: string;
  material?: string;
  operationType?: string;
  events: VehicleJourneyEvent[];
  journeySteps: VehicleJourneyStep[];
};

export type VehicleJourneyPayload = {
  vehicle: Record<string, unknown>;
  appointment?: Record<string, unknown> | null;
  queue_entry?: Record<string, unknown> | null;
  dock?: Record<string, unknown> | null;
  zone_name?: string | null;
  zone_code?: string | null;
  current_stage?: string;
  queue_status?: string | null;
  events?: Record<string, unknown>[];
};

function statusIndex(status: string) {
  const normalized = String(status || "").toUpperCase();
  const idx = JOURNEY_STEPS.indexOf(normalized as (typeof JOURNEY_STEPS)[number]);
  return idx >= 0 ? idx : 0;
}

export function buildJourneySteps(status: string): VehicleJourneyStep[] {
  const currentIdx = statusIndex(status);
  const visible = JOURNEY_STEPS.filter((step) => {
    if (step === "SCHEDULED") return true;
    if (["EXIT_HOLDING", "EXIT_VERIFIED", "EXITED"].includes(step)) {
      return currentIdx >= statusIndex("COMPLETED");
    }
    return statusIndex(step) <= currentIdx + 1;
  });

  return visible.map((step) => {
    const idx = statusIndex(step);
    return {
      key: step,
      label: JOURNEY_LABELS[step] || step,
      done: idx < currentIdx,
      current: idx === currentIdx,
    };
  });
}

export function mapVehicle360Profile(journey: VehicleJourneyPayload): Vehicle360Profile {
  const vehicle = journey.vehicle || {};
  const appointment = journey.appointment || null;
  const queue = journey.queue_entry || null;
  const dock = journey.dock || null;
  const status = String(vehicle.status || "SCHEDULED");
  const shipment = String(appointment?.shipment_reference || "");
  const material = shipment.split("|")[1] || vehicle.material_type;

  const events = (journey.events || [])
    .slice()
    .sort((a, b) => new Date(String(b.event_time)).getTime() - new Date(String(a.event_time)).getTime())
    .slice(0, 12)
    .map((event) => ({
      id: String(event.id),
      time: new Date(String(event.event_time)).toLocaleTimeString(undefined, {
        hour: "2-digit",
        minute: "2-digit",
      }),
      type: String(event.event_type || "EVENT").replace(/_/g, " "),
      note: event.event_note ? String(event.event_note) : undefined,
    }));

  return {
    vehicleId: String(vehicle.id),
    plate: String(vehicle.vehicle_number || "—"),
    transporter: String(vehicle.transporter_name || "—"),
    driver: String(vehicle.driver_name || "—"),
    driverPhone: vehicle.driver_phone ? String(vehicle.driver_phone) : undefined,
    status,
    currentStage: String(journey.current_stage || status),
    zone: journey.zone_name ? String(journey.zone_name) : journey.zone_code ? String(journey.zone_code) : undefined,
    dockCode: dock?.dock_code ? String(dock.dock_code) : undefined,
    dockId: dock?.id ? String(dock.id) : null,
    appointmentId: appointment?.id ? String(appointment.id) : null,
    appointmentRef: appointment?.booking_reference ? String(appointment.booking_reference) : undefined,
    queueEntryId: queue?.id ? String(queue.id) : null,
    queueNumber: queue?.queue_number ? String(queue.queue_number) : undefined,
    queueStatus: journey.queue_status ? String(journey.queue_status) : queue?.status ? String(queue.status) : undefined,
    material: material ? String(material) : undefined,
    operationType: vehicle.operation_type ? String(vehicle.operation_type) : undefined,
    events,
    journeySteps: buildJourneySteps(status),
  };
}

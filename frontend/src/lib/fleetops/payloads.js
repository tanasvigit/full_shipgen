import { POD_METHODS } from "./constants";

const clean = (obj) => {
  const out = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined || v === null || v === "") continue;
    if (typeof v === "object" && !Array.isArray(v) && Object.keys(v).length === 0) continue;
    out[k] = v;
  }
  return out;
};

/** GeoJSON Point for FleetOps spatial `location` column (required on create). */
export function buildGeoLocation(values) {
  const lat =
    values?.latitude != null && values.latitude !== "" ? Number(values.latitude) : null;
  const lng =
    values?.longitude != null && values.longitude !== "" ? Number(values.longitude) : null;
  if (lat == null || lng == null || Number.isNaN(lat) || Number.isNaN(lng)) {
    return null;
  }
  return {
    type: "Point",
    coordinates: [lng, lat],
  };
}

export function buildDriverPayload(values) {
  const body = clean({
    name: values.name,
    email: values.email,
    phone: values.phone,
    password: values.password,
    drivers_license_number: values.licenseNumber,
    internal_id: values.internalId,
    country: values.country?.toUpperCase?.() || values.country,
    city: values.city,
    status: values.status || "active",
    vehicle: values.vehicleId,
    vendor: values.vendorId,
    latitude: values.latitude != null && values.latitude !== "" ? Number(values.latitude) : undefined,
    longitude: values.longitude != null && values.longitude !== "" ? Number(values.longitude) : undefined,
    skills: values.skills?.length ? values.skills : undefined,
    max_travel_time: values.maxTravelTime != null && values.maxTravelTime !== "" ? Number(values.maxTravelTime) : undefined,
    max_distance: values.maxDistance != null && values.maxDistance !== "" ? Number(values.maxDistance) : undefined,
    time_window_start: values.timeWindowStart || undefined,
    time_window_end: values.timeWindowEnd || undefined,
    custom_field_values: values.customFieldValues,
  });
  return { driver: body };
}

export function buildVehiclePayload(values) {
  const yearNum = Number(values.year);
  const body = clean({
    name: values.name,
    plate_number: values.plate,
    vin: values.vin,
    make: values.make,
    model: values.model,
    year: Number.isFinite(yearNum) ? yearNum : undefined,
    vehicle_type: values.type,
    status: values.status || "operational",
    online: values.online ?? false,
    driver: values.driverId,
    fuel_type: values.fuelType,
    odometer: values.odometer != null && values.odometer !== "" ? Number(values.odometer) : undefined,
    payload_capacity: values.payloadCapacity != null && values.payloadCapacity !== "" ? Number(values.payloadCapacity) : undefined,
    cargo_volume: values.cargoVolume != null && values.cargoVolume !== "" ? Number(values.cargoVolume) : undefined,
    length: values.length != null && values.length !== "" ? Number(values.length) : undefined,
    width: values.width != null && values.width !== "" ? Number(values.width) : undefined,
    height: values.height != null && values.height !== "" ? Number(values.height) : undefined,
    ownership_type: values.ownershipType,
    description: values.description,
    latitude: values.latitude != null && values.latitude !== "" ? Number(values.latitude) : undefined,
    longitude: values.longitude != null && values.longitude !== "" ? Number(values.longitude) : undefined,
    custom_field_values: values.customFieldValues,
  });
  return { vehicle: body };
}

export function buildPlacePayload(values) {
  const body = clean({
    name: values.name,
    street1: values.street1 || values.address,
    street2: values.street2,
    city: values.city,
    province: values.province || values.state,
    postal_code: values.postalCode,
    country: values.country?.toUpperCase?.() || values.country,
    phone: values.phone,
    type: values.type || "pickup",
    opening_hours: values.openingHours,
    security_access_code: values.securityAccessCode,
    location:
      buildGeoLocation(values) ||
      (values.street1 || values.address
        ? { type: "Point", coordinates: [0, 0] }
        : undefined),
    meta: values.notes ? { notes: values.notes } : undefined,
    custom_field_values: values.customFieldValues,
  });
  return { place: body };
}

export function buildFleetPayload(values) {
  const body = clean({
    name: values.name,
    description: values.description,
    service_area: values.serviceAreaId,
    meta: clean({
      region: values.region,
      territory: values.territory,
      status: values.status,
      manager_name: values.managerName,
    }),
  });
  return { fleet: body };
}

export function buildOrderPayload(values, { orderConfigKey } = {}) {
  const pickup = values.pickupId;
  const dropoff = values.dropoffId;
  const payload = clean({
    pickup_uuid: pickup,
    dropoff_uuid: dropoff,
    return_uuid: values.returnId,
    waypoints: values.multiWaypoint
      ? (values.waypoints || [])
          .filter((w) => w.placeId)
          .map((w) =>
            clean({
              place_uuid: w.placeId,
              customer: w.customerId,
              type: w.type || "dropoff",
            }),
          )
      : undefined,
    entities: (values.entities || [])
      .filter((e) => e.name || e.sku)
      .map((e) =>
        clean({
          name: e.name,
          sku: e.sku,
          destination_uuid: e.destinationId,
          quantity: e.quantity != null && e.quantity !== "" ? Number(e.quantity) : undefined,
          weight: e.weight != null && e.weight !== "" ? Number(e.weight) : undefined,
        }),
      ),
  });

  const metaPairs = (values.metadataPairs || []).filter((p) => p.key?.trim());
  let meta;
  if (metaPairs.length) {
    meta = metaPairs.reduce((acc, p) => {
      acc[p.key.trim()] = p.value;
      return acc;
    }, {});
  } else if (values.metaJson?.trim()) {
    try {
      meta = JSON.parse(values.metaJson);
    } catch {
      meta = undefined;
    }
  }

  const body = clean({
    order_config_uuid: values.orderConfigId,
    type: values.type || orderConfigKey || "default",
    internal_id: values.internalId,
    scheduled_at: values.scheduledAt,
    customer: values.customerId,
    facilitator: values.facilitatorId,
    driver: values.driverId,
    vehicle_assigned: values.vehicleId,
    service_type: values.serviceType,
    status: values.status,
    priority: values.priority,
    notes: values.notes,
    dispatch_notes: values.dispatchNotes,
    instructions: values.instructions,
    adhoc: values.adhoc,
    adhoc_distance: values.adhocDistance != null && values.adhocDistance !== "" ? Number(values.adhocDistance) : undefined,
    dispatched: values.dispatched,
    pod_required: values.podRequired,
    pod_method: values.podRequired ? values.podMethod || POD_METHODS[0] : undefined,
    time_window_start: values.timeWindowStart,
    time_window_end: values.timeWindowEnd,
    required_skills: values.requiredSkills?.length ? values.requiredSkills : undefined,
    orchestrator_priority:
      values.orchestratorPriority != null && values.orchestratorPriority !== ""
        ? Number(values.orchestratorPriority)
        : undefined,
    service_quote: values.serviceQuoteId,
    payload: Object.keys(payload).length ? payload : undefined,
    files: values.files?.length ? values.files.map((f) => ({ uuid: f.uuid || f.id })) : undefined,
    custom_field_values: values.customFieldValues,
    meta,
  });

  return { order: body };
}

export function buildScheduleItemPayload(values) {
  const dayIdx = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].indexOf(values.day);
  return clean({
    driver_uuid: values.driverId,
    driver: values.driverId,
    weekday: values.day,
    day_of_week: dayIdx >= 0 ? dayIdx : undefined,
    start_hour: Number(values.start),
    end_hour: Number(values.end),
    notes: values.notes,
  });
}

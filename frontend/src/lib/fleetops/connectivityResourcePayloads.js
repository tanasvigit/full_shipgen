/** API payload helpers for Connectivity & Resources CRUD (align to /int/v1 contracts). */

import { buildGeoLocation } from "./payloads";
import { coordsFromGeoPoint } from "./geofence";

const DEFAULT_LAST_POSITION = { type: "Point", coordinates: [0, 0] };
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isUuid(value) {
  return UUID_RE.test(String(value || "").trim());
}

function omitEmpty(obj) {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== undefined && v !== null && v !== ""),
  );
}

function parseCredentials(value) {
  if (value == null || value === "") return {};
  if (typeof value === "object" && !Array.isArray(value)) return value;
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return typeof parsed === "object" && parsed != null && !Array.isArray(parsed) ? parsed : {};
    } catch {
      return {};
    }
  }
  return {};
}

function withLastPosition(payload, values = {}, { forCreate = false } = {}) {
  const position = buildGeoLocation(values);
  if (position) {
    payload.last_position = position;
  } else if (forCreate) {
    payload.last_position = DEFAULT_LAST_POSITION;
  }
  return payload;
}

function resolveTelematicUuidField(values = {}) {
  if (values.telematic_uuid === null) return null;
  if ("telematic" in values && String(values.telematic ?? "").trim() === "") return null;
  return (
    values.telematic_uuid ||
    (isUuid(values.telematic) ? values.telematic : undefined) ||
    (isUuid(values.telematic_public_id) ? values.telematic_public_id : undefined)
  );
}

export function buildDeviceApiPayload(values = {}, options = {}) {
  const telematicUuid = resolveTelematicUuidField(values);
  const payload = withLastPosition(
    omitEmpty({
      name: values.name,
      imei: values.imei,
      serial_number: values.serial_number || values.serial,
      provider: values.provider,
      status: values.status,
      type: values.type,
      model: values.model,
      manufacturer: values.manufacturer,
      telematic_uuid: telematicUuid === null ? undefined : telematicUuid,
    }),
    values,
    options,
  );
  if (telematicUuid === null) {
    payload.telematic_uuid = null;
  }
  return payload;
}

export function buildSensorApiPayload(values = {}, options = {}) {
  return withLastPosition(
    omitEmpty({
      name: values.name,
      type: values.type,
      unit: values.unit,
      device_uuid:
        values.device_uuid ||
        (isUuid(values.device) ? values.device : undefined) ||
        (isUuid(values.device_public_id) ? values.device_public_id : undefined),
      min_threshold: values.min_threshold ?? values.threshold,
      max_threshold: values.max_threshold,
      status: values.status,
    }),
    values,
    options,
  );
}

export function buildTelematicApiPayload(values = {}, options = {}) {
  const payload = omitEmpty({
    name: values.name,
    provider: values.provider,
    status: values.status,
    model: values.model,
    serial_number: values.serial_number,
    imei: values.imei,
  });
  if (options.forCreate || values.credentials !== undefined) {
    payload.credentials = parseCredentials(values.credentials);
  }
  return payload;
}

export function buildEntityApiPayload(values = {}) {
  return omitEmpty({
    name: values.name,
    type: values.type,
    sku: values.sku,
    description: values.description,
    weight: values.weight,
    weight_unit: values.weight_unit || (values.weight ? "kg" : undefined),
    declared_value: values.declared_value,
    payload_uuid: values.payload_uuid,
    payload: values.payload || values.payload_public_id,
  });
}

export function buildPayloadApiPayload(values = {}) {
  return omitEmpty({
    type: values.type,
    pickup_uuid: values.pickup_uuid,
    dropoff_uuid: values.dropoff_uuid,
    pickup: values.pickup,
    dropoff: values.dropoff,
    cod_amount: values.cod_amount,
    cod_currency: values.cod_currency,
    cod_payment_method: values.cod_payment_method,
  });
}

export function buildTrackingNumberApiPayload(values = {}) {
  return omitEmpty({
    region: values.region,
    owner_uuid: values.owner_uuid,
    owner_type: values.owner_type,
    owner: values.owner,
    type: values.type,
    status: values.status,
  });
}

function prepareTrackingStatusCode(status) {
  return String(status || "")
    .replace(/\s+/g, "_")
    .replace(/[^A-Za-z0-9\-_]/g, "")
    .toUpperCase();
}

export function buildTrackingStatusApiPayload(values = {}) {
  const location = values.location || buildGeoLocation(values);
  const code = values.code || (values.status ? prepareTrackingStatusCode(values.status) : undefined);
  return omitEmpty({
    tracking_number_uuid: values.tracking_number_uuid,
    tracking_number: values.tracking_number,
    order: values.order,
    status: values.status,
    code,
    details: values.details,
    latitude: values.latitude,
    longitude: values.longitude,
    location,
    country: values.country,
  });
}

export function buildPurchaseRateApiPayload(values = {}) {
  const quoteRef = values.service_quote;
  const service_quote_uuid =
    values.service_quote_uuid ?? (isUuid(quoteRef) ? String(quoteRef) : undefined);
  const service_quote =
    values.service_quote_public_id ?? (!isUuid(quoteRef) && quoteRef ? String(quoteRef) : undefined);

  const payloadRef = values.payload;
  const payload_uuid =
    values.payload_uuid ?? (isUuid(payloadRef) ? String(payloadRef) : undefined);
  const payload = !isUuid(payloadRef) && payloadRef ? String(payloadRef) : undefined;

  // NOTE: purchase_rates has no order column — orders reference a rate via
  // orders.purchase_rate_uuid, so the link is established from the order side.
  return omitEmpty({
    service_quote_uuid,
    service_quote,
    payload_uuid,
    payload,
    customer_uuid: values.customer_uuid,
    customer_type: values.customer_type,
    customer: values.customer,
    status: values.status || "active",
  });
}

export function deviceValuesFromApi(raw) {
  if (!raw) return {};
  const telematicUuid = raw.telematic?.uuid || raw.telematic_uuid || "";
  return {
    name: raw.name || "",
    imei: raw.imei || "",
    serial_number: raw.serial_number || raw.serial || "",
    provider: raw.provider || "",
    status: raw.status || "",
    type: raw.type || "",
    model: raw.model || "",
    manufacturer: raw.manufacturer || "",
    telematic_uuid: telematicUuid,
    telematic: raw.telematic?.public_id || telematicUuid || "",
  };
}

export function sensorValuesFromApi(raw) {
  if (!raw) return {};
  const deviceUuid = raw.device?.uuid || raw.device_uuid || "";
  return {
    name: raw.name || "",
    type: raw.type || raw.sensor_type || "",
    unit: raw.unit || "",
    device_uuid: deviceUuid,
    device:
      raw.device?.public_id ||
      deviceUuid ||
      raw.device_public_id ||
      "",
    min_threshold: raw.min_threshold ?? "",
    max_threshold: raw.max_threshold ?? "",
    status: raw.status || "",
  };
}

export function coerceResourceSelectValue(value, options = []) {
  const needle = String(value ?? "").trim();
  if (!needle) return "";
  if (options.some((o) => o.id === needle)) return needle;
  const match = options.find((o) => o.uuid === needle || o.publicId === needle);
  return match?.id || needle;
}

export function entityValuesFromApi(raw) {
  if (!raw) return {};
  return {
    name: raw.name || "",
    type: raw.type || "",
    sku: raw.sku || "",
    description: raw.description || "",
    weight: raw.weight ?? "",
    weight_unit: raw.weight_unit || "kg",
    declared_value: raw.declared_value ?? "",
    payload:
      raw.payload?.public_id ||
      raw.payload?.uuid ||
      raw.payload_public_id ||
      raw.payload_uuid ||
      "",
  };
}

export function payloadValuesFromApi(raw) {
  if (!raw) return {};
  return {
    type: raw.type || "",
    pickup: raw.pickup?.public_id || raw.pickup?.uuid || raw.pickup_public_id || raw.pickup_uuid || "",
    dropoff: raw.dropoff?.public_id || raw.dropoff?.uuid || raw.dropoff_public_id || raw.dropoff_uuid || "",
    cod_amount: raw.cod_amount ?? "",
    cod_currency: raw.cod_currency || "",
    cod_payment_method: raw.cod_payment_method || "",
  };
}

export function trackingNumberValuesFromApi(raw) {
  if (!raw) return {};
  return {
    region: raw.region || "",
    owner:
      raw.owner?.public_id ||
      raw.subject ||
      raw.owner_public_id ||
      raw.owner_uuid ||
      "",
    type: raw.type || "",
    status: raw.status || "active",
  };
}

export function trackingStatusValuesFromApi(raw) {
  if (!raw) return {};
  const loc = raw.location;
  const trackingNumber = raw.tracking_number;
  return {
    tracking_number:
      trackingNumber?.public_id ||
      trackingNumber?.tracking_number ||
      raw.tracking_number_public_id ||
      raw.tracking_number_uuid ||
      "",
    order: raw.order?.public_id || raw.order?.uuid || "",
    status: raw.status || "",
    code: raw.code || "",
    details: raw.details || "",
    latitude: raw.latitude ?? loc?.coordinates?.[1] ?? loc?.lat ?? "",
    longitude: raw.longitude ?? loc?.coordinates?.[0] ?? loc?.lng ?? "",
    country: raw.country || "",
  };
}

/** Internal API returns these relations as bare public-id strings or nested objects. */
function refPublicId(value) {
  if (value == null) return "";
  if (typeof value === "string") return value;
  if (typeof value === "object") return value.public_id || value.uuid || "";
  return "";
}

export function purchaseRateValuesFromApi(raw) {
  if (!raw) return {};
  const quote = raw.service_quote && typeof raw.service_quote === "object" ? raw.service_quote : {};
  const service_quote_uuid = quote.uuid || raw.service_quote_uuid || "";
  const service_quote_public_id =
    quote.public_id ||
    (typeof raw.service_quote === "string" ? raw.service_quote : "") ||
    raw.service_quote_id ||
    raw.service_quote_public_id ||
    "";
  return {
    // Value bound to the select — prefer uuid (stable FK), fall back to public id.
    service_quote: service_quote_uuid || service_quote_public_id || "",
    service_quote_uuid,
    service_quote_public_id,
    service_quote_amount: quote.amount ?? raw.amount ?? "",
    service_quote_currency: quote.currency ?? raw.currency ?? "",
    payload: refPublicId(raw.payload) || raw.payload_id || raw.payload_uuid || "",
    order: refPublicId(raw.order) || raw.order_id || "",
    customer: refPublicId(raw.customer) || raw.customer_id || "",
    status: raw.status || "",
  };
}

export function deviceEventLabel(raw) {
  return raw?.event_type || raw?.type || raw?.code || raw?.public_id || "Device event";
}

export function deviceEventType(raw) {
  return raw?.event_type || raw?.type || "";
}

/** Vehicle id from a device record (polymorphic attachable or legacy vehicle_uuid). */
export function deviceVehicleId(device) {
  if (!device) return null;
  return (
    device.attachable_uuid ||
    device.attachable?.uuid ||
    device.vehicle_uuid ||
    device.vehicle_id ||
    device.vehicle?.uuid ||
    device.vehicle?.id ||
    null
  );
}

export function isDeviceAttachedToVehicle(device) {
  const vehicleId = deviceVehicleId(device);
  if (!vehicleId) return false;
  const type = String(device.attachable_type || "").toLowerCase();
  return !type || type.includes("vehicle");
}

/** Collect device identifiers on an event for filter matching. */
export function eventDeviceIds(event) {
  const ids = new Set();
  for (const value of [
    event?.device_uuid,
    event?.device_id,
    event?.device?.uuid,
    event?.device?.id,
    event?.device?.public_id,
  ]) {
    if (value) ids.add(String(value));
  }
  return ids;
}

export function eventMatchesDevice(event, deviceId) {
  if (!deviceId) return false;
  return eventDeviceIds(event).has(String(deviceId));
}

export function recordMatchesTelematic(device, telematicId) {
  if (!telematicId) return true;
  const needle = String(telematicId);
  const candidates = [
    device?.telematic_uuid,
    device?.telematic?.uuid,
    device?.telematic?.public_id,
  ].map((v) => String(v || ""));
  return candidates.some((v) => v && v === needle);
}

export function isLiveMapCoords(lat, lng) {
  if (lat == null || lng == null || Number.isNaN(Number(lat)) || Number.isNaN(Number(lng))) {
    return false;
  }
  return !(Number(lat) === 0 && Number(lng) === 0);
}

/**
 * Live /fleet-ops/live/vehicles only returns rows with vehicles.location set.
 * Supplement with attached device GPS and driver-assigned vehicle positions.
 */
export function enrichLiveVehicles(vehicles = [], { devices = [], drivers = [] } = {}) {
  const byId = new Map();

  const add = (entry) => {
    const id = String(entry?.uuid || entry?.id || "");
    if (!id || byId.has(id)) return;
    const fromLocation = coordsFromGeoPoint(entry?.location);
    const lat = fromLocation.lat ?? entry?.latitude ?? entry?.lat;
    const lng = fromLocation.lng ?? entry?.longitude ?? entry?.lng;
    if (!isLiveMapCoords(lat, lng)) return;
    byId.set(id, {
      ...entry,
      uuid: entry.uuid || id,
      location: entry.location ?? { type: "Point", coordinates: [Number(lng), Number(lat)] },
    });
  };

  for (const vehicle of vehicles) add(vehicle);

  for (const device of devices) {
    if (!isDeviceAttachedToVehicle(device)) continue;
    const vehicleId = deviceVehicleId(device);
    const coords = coordsFromGeoPoint(device.last_position);
    if (!isLiveMapCoords(coords.lat, coords.lng)) continue;
    add({
      uuid: vehicleId,
      id: vehicleId,
      name: device.attached_to_name || device.attachable_name || device.attachable?.name || device.name,
      plate_number: device.attachable?.plate_number,
      location: device.last_position,
    });
  }

  for (const driver of drivers) {
    const vehicleId = driver.vehicle_uuid || driver.vehicle?.uuid || driver.vehicle?.id;
    if (!vehicleId) continue;
    const coords = coordsFromGeoPoint(driver.location);
    if (!isLiveMapCoords(coords.lat, coords.lng)) continue;
    add({
      uuid: vehicleId,
      id: vehicleId,
      name: driver.vehicle_name || driver.vehicle?.name || driver.vehicle?.display_name,
      plate_number: driver.vehicle?.plate_number,
      location: driver.location,
    });
  }

  return [...byId.values()];
}

export function manifestLabel(raw) {
  return raw?.public_id || raw?.name || raw?.uuid || "Manifest";
}

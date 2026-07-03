/** Map service rate form values ↔ /int/v1 service-rates API fields. */

function omitEmpty(obj) {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== undefined && v !== null && v !== ""),
  );
}

function numOrUndefined(value) {
  if (value === undefined || value === null || value === "") return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
}

export function serviceRateValuesFromApi(row = {}) {
  const method = row.rate_calculation_method || row.rateCalculationMethod || "fixed_rate";
  const perMeterFee = row.per_meter_flat_rate_fee ?? row.perMeterFlatRateFee;
  const perMeterUnit = row.per_meter_unit || row.perMeterUnit || "";

  let perDistanceFee = "";
  let perDistanceUnit = "km";
  if (method === "per_meter" && perMeterFee != null && perMeterFee !== "") {
    perDistanceFee = String(perMeterFee);
    perDistanceUnit = perMeterUnit === "m" ? "m" : "km";
  }

  return {
    name: row.service_name || row.serviceName || row.name || "",
    serviceType: row.service_type || row.serviceType || "",
    baseFee: row.base_fee != null && row.base_fee !== "" ? String(row.base_fee) : "",
    rateCalculationMethod: method,
    perDistanceFee,
    perDistanceUnit,
    currency: row.currency || "INR",
    publicId: row.public_id || "",
  };
}

export function buildServiceRateApiPayload(values = {}) {
  const serviceName = String(values.name ?? values.service_name ?? "").trim();
  const serviceType = String(values.service_type ?? values.serviceType ?? "").trim();
  const currency = String(values.currency || "INR").trim().toUpperCase().slice(0, 3);

  let rateCalculationMethod =
    values.rate_calculation_method ?? values.rateCalculationMethod ?? "fixed_rate";

  const perDistanceFee = numOrUndefined(values.per_distance_fee ?? values.perDistanceFee);
  const perDistanceUnit = values.per_distance_unit ?? values.perDistanceUnit ?? "km";

  // Legacy form keys from older UI builds.
  const perKm = numOrUndefined(values.per_km ?? values.perKm);
  const perMile = numOrUndefined(values.per_mile ?? values.perMile);

  let perMeterFlatRateFee;
  let perMeterUnit;
  if (perDistanceFee != null) {
    rateCalculationMethod = "per_meter";
    perMeterFlatRateFee = perDistanceFee;
    perMeterUnit = perDistanceUnit === "m" ? "m" : "km";
  } else if (perKm != null) {
    rateCalculationMethod = "per_meter";
    perMeterFlatRateFee = perKm;
    perMeterUnit = "km";
  } else if (perMile != null) {
    rateCalculationMethod = "per_meter";
    perMeterFlatRateFee = perMile;
    perMeterUnit = "m";
  }

  const payload = omitEmpty({
    service_name: serviceName,
    service_type: serviceType,
    base_fee: numOrUndefined(values.base_fee ?? values.baseFee),
    currency,
    rate_calculation_method: rateCalculationMethod,
    per_meter_flat_rate_fee: perMeterFlatRateFee,
    per_meter_unit: perMeterUnit,
  });

  if (!payload.currency) payload.currency = "INR";
  if (!payload.rate_calculation_method) payload.rate_calculation_method = "fixed_rate";

  return payload;
}

export function serviceRateRowId(row = {}) {
  return row.uuid || row.id || row.public_id;
}

export function serviceRateDisplayName(row = {}) {
  return row.service_name || row.serviceName || row.name || row.public_id || row.uuid || row.id || "—";
}

export function serviceRatePerDistanceLabel(row = {}) {
  const method = row.rate_calculation_method || row.rateCalculationMethod;
  if (method !== "per_meter") return "—";
  const fee = row.per_meter_flat_rate_fee ?? row.perMeterFlatRateFee;
  if (fee == null || fee === "") return "—";
  const unit = row.per_meter_unit || row.perMeterUnit || "km";
  return `${fee} / ${unit}`;
}

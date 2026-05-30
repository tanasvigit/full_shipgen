/** Compliance rule definitions — extend with backend fields when available. */

export const COMPLIANCE_RULES = {
  driver_license_expired: {
    id: "driver-license-expired",
    entity: "driver",
    severity: "blocking",
    message: "Driver license has expired.",
    remediation: "Update license information before assignment.",
  },
  driver_license_expiring: {
    id: "driver-license-expiring",
    entity: "driver",
    severity: "warning",
    message: "Driver license expires within 30 days.",
    remediation: "Schedule renewal.",
  },
  vehicle_insurance_expired: {
    id: "vehicle-insurance-expired",
    entity: "vehicle",
    severity: "blocking",
    message: "Vehicle insurance has expired.",
    remediation: "Upload current insurance documentation.",
  },
  vehicle_insurance_expiring: {
    id: "vehicle-insurance-expiring",
    entity: "vehicle",
    severity: "warning",
    message: "Vehicle insurance expires within 30 days.",
  },
  missing_pod: {
    id: "missing-pod",
    entity: "order",
    severity: "warning",
    message: "Proof of delivery required but not attached.",
    remediation: "Upload POD before completing.",
  },
};

const DAYS_MS = 86400000;

function parseDate(v) {
  if (!v) return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
}

function daysUntil(date) {
  return Math.ceil((date.getTime() - Date.now()) / DAYS_MS);
}

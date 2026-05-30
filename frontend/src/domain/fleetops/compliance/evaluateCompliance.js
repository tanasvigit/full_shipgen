import { COMPLIANCE_RULES } from "./rules";

function parseDate(v) {
  if (!v) return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
}

function daysUntil(date) {
  return Math.ceil((date.getTime() - Date.now()) / 86400000);
}

function issueFromRule(ruleKey, overrides = {}) {
  const rule = COMPLIANCE_RULES[ruleKey];
  if (!rule) return null;
  return {
    id: rule.id,
    level: rule.severity === "blocking" ? "blocking" : rule.severity,
    message: overrides.message || rule.message,
    remediation: overrides.remediation || rule.remediation,
    entity: rule.entity,
  };
}

export function evaluateDriverCompliance(rawDriver) {
  if (!rawDriver) return [];
  const issues = [];
  const expiry = parseDate(
    rawDriver.license_expiry ||
      rawDriver.drivers_license_expiry ||
      rawDriver.meta?.license_expiry,
  );
  if (expiry) {
    const days = daysUntil(expiry);
    if (days < 0) issues.push(issueFromRule("driver_license_expired"));
    else if (days <= 30) issues.push(issueFromRule("driver_license_expiring", { message: `License expires in ${days} days.` }));
  }
  return issues.filter(Boolean);
}

export function evaluateVehicleCompliance(rawVehicle) {
  if (!rawVehicle) return [];
  const issues = [];
  const expiry = parseDate(
    rawVehicle.insurance_expiry || rawVehicle.meta?.insurance_expiry || rawVehicle.meta?.insurance_expires_at,
  );
  if (expiry) {
    const days = daysUntil(expiry);
    if (days < 0) issues.push(issueFromRule("vehicle_insurance_expired"));
    else if (days <= 30) issues.push(issueFromRule("vehicle_insurance_expiring", { message: `Insurance expires in ${days} days.` }));
  }
  return issues.filter(Boolean);
}

export function evaluateOrderCompliance(rawOrder) {
  if (!rawOrder) return [];
  const issues = [];
  if (rawOrder.pod_required && !(rawOrder.files?.length || rawOrder.proofs?.length)) {
    const terminal = ["completed", "delivered"].includes(String(rawOrder.status || "").toLowerCase());
    if (terminal) issues.push(issueFromRule("missing_pod"));
  }
  return issues.filter(Boolean);
}

export function evaluateEntityCompliance({ driver, vehicle, order } = {}) {
  return [
    ...evaluateDriverCompliance(driver?.raw || driver),
    ...evaluateVehicleCompliance(vehicle?.raw || vehicle),
    ...evaluateOrderCompliance(order?.raw || order),
  ];
}

/**
 * Assignment eligibility — when driver/vehicle may be assigned to operational work.
 */

export function evaluateAssignment({ driver, vehicle, orderStatus } = {}) {
  const issues = [];

  if (driver) {
    const st = String(driver.status || driver.raw?.status || "").toLowerCase();
    if (st && !["active", "online"].includes(st)) {
      issues.push({
        code: "driver-unavailable",
        severity: "warning",
        blocking: false,
        message: `Driver is ${st.replace(/_/g, " ")}.`,
      });
    }
  } else if (orderStatus && !["created", "canceled", "cancelled"].includes(String(orderStatus).toLowerCase())) {
    issues.push({
      code: "driver-missing",
      severity: "info",
      blocking: false,
      message: "No driver assigned.",
    });
  }

  if (vehicle) {
    const vst = String(vehicle.status || vehicle.raw?.status || "").toLowerCase();
    if (["maintenance", "decommissioned", "out_of_service"].includes(vst)) {
      issues.push({
        code: "vehicle-unavailable",
        severity: "warning",
        blocking: true,
        message: `Vehicle is ${vst.replace(/_/g, " ")} — reassignment recommended.`,
      });
    }
  }

  return {
    allowed: !issues.some((i) => i.blocking),
    issues,
  };
}

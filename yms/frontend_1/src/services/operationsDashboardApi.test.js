import {
  OPERATIONS_SLA,
  slaComplianceAccent,
  timeMetricAccent,
} from "./operationsDashboardApi";

describe("operationsDashboardApi", () => {
  test("timeMetricAccent applies SLA color bands", () => {
    expect(timeMetricAccent(30, OPERATIONS_SLA.waitingMinutes)).toBe("success");
    expect(timeMetricAccent(55, OPERATIONS_SLA.waitingMinutes)).toBe("warning");
    expect(timeMetricAccent(90, OPERATIONS_SLA.waitingMinutes)).toBe("danger");
  });

  test("slaComplianceAccent applies compliance bands", () => {
    expect(slaComplianceAccent(95)).toBe("success");
    expect(slaComplianceAccent(75)).toBe("warning");
    expect(slaComplianceAccent(50)).toBe("danger");
  });
});

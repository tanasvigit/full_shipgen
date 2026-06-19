import {
  ACTIVE_APPOINTMENT_STATUSES,
  IN_YARD_VEHICLE_STATUSES,
  isVehicleInYard,
  lifecycleDisplayLabel,
} from "./lifecycleStatuses";

describe("lifecycleStatuses", () => {
  test("in-yard set includes operational lifecycle statuses", () => {
    for (const s of [
      "ARRIVED",
      "WAITING",
      "CALLED",
      "DOCK_ASSIGNED",
      "RESOURCE_PENDING",
      "READY_FOR_LOADING",
      "LOADING",
      "EXIT_HOLDING",
      "EXIT_VERIFIED",
    ]) {
      expect(IN_YARD_VEHICLE_STATUSES.has(s)).toBe(true);
    }
  });

  test("CALLED displays as Staging", () => {
    expect(lifecycleDisplayLabel("CALLED")).toBe("Staging");
    expect(lifecycleDisplayLabel("REPORTING_TO_DOCK")).toBe("Staging");
  });

  test("active appointment filter covers exit-holding phases", () => {
    expect(ACTIVE_APPOINTMENT_STATUSES).toContain("EXIT_HOLDING");
    expect(ACTIVE_APPOINTMENT_STATUSES).toContain("EXIT_VERIFIED");
    expect(ACTIVE_APPOINTMENT_STATUSES).toContain("RESOURCE_PENDING");
  });

  test("isVehicleInYard excludes exited and scheduled", () => {
    expect(isVehicleInYard({ status: "LOADING" })).toBe(true);
    expect(isVehicleInYard({ status: "EXITED" })).toBe(false);
    expect(isVehicleInYard({ status: "SCHEDULED" })).toBe(false);
  });
});

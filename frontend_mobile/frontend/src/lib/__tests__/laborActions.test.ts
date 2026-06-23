import { describe, expect, it } from "vitest";
import { DEFAULT_LABOR_FORM, validateLaborForm, canDeleteLaborRow } from "@/src/lib/laborActions";

describe("laborActions", () => {
  it("requires core labor team fields", () => {
    const errors = validateLaborForm(DEFAULT_LABOR_FORM);
    expect(errors.teamName).toBeDefined();
    expect(errors.supervisorName).toBeDefined();
    expect(errors.supervisorPhone).toBeDefined();
  });

  it("accepts a valid labor form", () => {
    const errors = validateLaborForm({
      ...DEFAULT_LABOR_FORM,
      teamName: "Loading Team A",
      supervisorName: "Rohan D.",
      supervisorPhone: "+91-9876543210",
    });
    expect(Object.keys(errors)).toHaveLength(0);
  });

  it("blocks delete for assigned labor teams", () => {
    expect(canDeleteLaborRow({ status: "ON_DUTY", assignedDockId: null })).toBe(true);
    expect(canDeleteLaborRow({ status: "ASSIGNED", assignedDockId: null })).toBe(false);
    expect(canDeleteLaborRow({ status: "ON_DUTY", assignedDockId: "dock-1" })).toBe(false);
  });
});

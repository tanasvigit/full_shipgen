import { describe, expect, it } from "vitest";
import { DEFAULT_EQUIPMENT_FORM, parseEquipmentBattery, validateEquipmentForm, canDeleteEquipmentRow } from "@/src/lib/equipmentActions";

describe("equipmentActions", () => {
  it("requires equipment name", () => {
    const errors = validateEquipmentForm(DEFAULT_EQUIPMENT_FORM);
    expect(errors.equipmentName).toBeDefined();
  });

  it("accepts a valid equipment form", () => {
    const errors = validateEquipmentForm({
      ...DEFAULT_EQUIPMENT_FORM,
      equipmentName: "Forklift 1",
      batteryLevel: "85",
    });
    expect(Object.keys(errors)).toHaveLength(0);
  });

  it("rejects invalid battery levels", () => {
    expect(parseEquipmentBattery("150")).toBe("invalid");
    expect(parseEquipmentBattery("")).toBe(null);
  });

  it("blocks delete for assigned or in-use equipment", () => {
    expect(canDeleteEquipmentRow({ status: "IDLE", assignedDockId: null })).toBe(true);
    expect(canDeleteEquipmentRow({ status: "IN_USE", assignedDockId: null })).toBe(false);
    expect(canDeleteEquipmentRow({ status: "IDLE", assignedDockId: "dock-1" })).toBe(false);
  });
});

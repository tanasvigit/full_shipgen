import { describe, expect, it } from "vitest";
import {
  generateBookingRef,
  validateBookingForm,
  canCancelAppointment,
} from "@/src/lib/appointmentActions";
import { validateQueueOverride } from "@/src/lib/queueOverrideActions";
import { validateCreateDockForm } from "@/src/lib/dockManageActions";
import { DOCK_ZONE_OPTIONS } from "@/src/lib/dockEnums";
import { canUpdateDetentionStatus } from "@/src/lib/detentionActions";

describe("yard create/update actions", () => {
  it("validates booking form requires plate and transporter", () => {
    const errors = validateBookingForm({
      plate: "",
      transporter: "",
      driverName: "",
      reqType: "Loading",
      material: "Steel",
      slot: "AM",
      gate: "G1",
      date: "2026-06-18",
      notes: "",
    });
    expect(errors.plate).toBeTruthy();
    expect(errors.transporter).toBeTruthy();
  });

  it("generates booking ref with date prefix", () => {
    const ref = generateBookingRef("2026-06-18");
    expect(ref).toMatch(/^APT-20260618-[A-Z0-9]+$/);
  });

  it("allows cancel only for scheduled appointments", () => {
    expect(canCancelAppointment("SCHEDULED")).toBe(true);
    expect(canCancelAppointment("EXITED")).toBe(false);
  });

  it("validates queue override reason length", () => {
    const errors = validateQueueOverride({ targetRank: 1, reason: "x", supervisor: "Supervisor" });
    expect(errors.reason).toBeTruthy();
  });

  it("validates create dock form", () => {
    expect(validateCreateDockForm({ dockName: "", dockType: "GENERAL", zone: "Zone A" }).dockName).toBeTruthy();
  });

  it("uses backend zone labels for dock creation", () => {
    expect(DOCK_ZONE_OPTIONS[0]).toBe("Zone A");
  });

  it("allows detention status transitions from Pending", () => {
    expect(canUpdateDetentionStatus("Pending", "Approved")).toBe(true);
    expect(canUpdateDetentionStatus("Paid", "Approved")).toBe(false);
  });
});

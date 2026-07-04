import { describe, expect, it } from "vitest";
import {
  appointmentLookupQuery,
  BOOKING_MATERIAL_CUSTOM,
  filterAppointmentsBySlot,
  groupAppointmentsBySlot,
  isValidBookingTimeSlot,
  mapAppointmentRow,
  normalizeBookingTimeSlot,
  parseRequestType,
  validateBookingForm,
} from "@/src/lib/appointmentActions";

describe("appointmentActions", () => {
  it("parses request type from shipment reference", () => {
    expect(parseRequestType("Loading|Steel|Dock A")).toBe("Loading");
    expect(parseRequestType("Unloading|FMCG|Warehouse")).toBe("Unloading");
    expect(parseRequestType("Transit|General|Hub")).toBe("Transit");
    expect(parseRequestType("Inter-Warehouse|Steel|WH-B")).toBe("Inter-Warehouse");
  });

  it("maps appointment rows with vehicle plate and normalized slot", () => {
    const row = mapAppointmentRow(
      {
        id: "appt-1",
        booking_reference: "APT-20260618-001",
        vehicle_id: "veh-1",
        booking_date: "2026-06-18",
        scheduled_slot: "AM",
        gate_number: "G1",
        shipment_reference: "Loading|Steel|Dock A",
        status: "SCHEDULED",
      },
      { id: "veh-1", vehicle_number: "MH12AB1234", transporter_name: "Acme" },
    );
    expect(row.plate).toBe("MH12AB1234");
    expect(row.type).toBe("Loading");
    expect(row.slot).toBe("09:00");
  });

  it("filters appointments by time slot", () => {
    const rows = [
      mapAppointmentRow({ id: "1", scheduled_slot: "09:00", status: "SCHEDULED" }),
      mapAppointmentRow({ id: "2", scheduled_slot: "14:00", status: "SCHEDULED" }),
    ];
    expect(filterAppointmentsBySlot(rows, "14:00")).toHaveLength(1);
  });

  it("groups appointments by time slot", () => {
    const rows = [
      mapAppointmentRow({ id: "1", scheduled_slot: "09:00", status: "SCHEDULED" }),
      mapAppointmentRow({ id: "2", scheduled_slot: "09:00", status: "SCHEDULED" }),
    ];
    expect(groupAppointmentsBySlot(rows)).toEqual([["09:00", rows]]);
  });

  it("normalizes and validates booking time slots", () => {
    expect(normalizeBookingTimeSlot("9:00")).toBe("09:00");
    expect(isValidBookingTimeSlot("09:00")).toBe(true);
    expect(isValidBookingTimeSlot("06:30")).toBe(false);
    expect(isValidBookingTimeSlot("20:00")).toBe(false);
    expect(isValidBookingTimeSlot("invalid")).toBe(false);
  });

  it("requires a custom material value when not using presets", () => {
    expect(
      validateBookingForm({
        plate: "MH12AB1234",
        transporter: "Acme",
        driverName: "",
        reqType: "Loading",
        material: BOOKING_MATERIAL_CUSTOM,
        slot: "09:00",
        gate: "G1",
        date: "2026-06-18",
        notes: "",
      }).material,
    ).toBe("Material type is required");
  });

  it("prefers plate over booking ref for gate lookup", () => {
    expect(
      appointmentLookupQuery(
        mapAppointmentRow(
          { id: "1", booking_reference: "APT-1", status: "SCHEDULED" },
          { id: "veh-1", vehicle_number: "MH12AB1234" },
        ),
      ),
    ).toBe("MH12AB1234");
  });
});

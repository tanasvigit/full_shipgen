import { describe, expect, it } from "vitest";
import {
  appointmentLookupQuery,
  filterAppointmentsBySlot,
  groupAppointmentsBySlot,
  mapAppointmentRow,
  parseRequestType,
} from "@/src/lib/appointmentActions";

describe("appointmentActions", () => {
  it("parses request type from shipment reference", () => {
    expect(parseRequestType("Loading|Steel|Dock A")).toBe("Loading");
    expect(parseRequestType("Unloading|FMCG|Warehouse")).toBe("Unloading");
  });

  it("maps appointment rows with vehicle plate and slot", () => {
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
    expect(row.slot).toBe("AM");
  });

  it("filters appointments by slot", () => {
    const rows = [
      mapAppointmentRow({ id: "1", scheduled_slot: "AM", status: "SCHEDULED" }),
      mapAppointmentRow({ id: "2", scheduled_slot: "PM", status: "SCHEDULED" }),
    ];
    expect(filterAppointmentsBySlot(rows, "PM")).toHaveLength(1);
  });

  it("groups appointments by slot", () => {
    const rows = [
      mapAppointmentRow({ id: "1", scheduled_slot: "AM", status: "SCHEDULED" }),
      mapAppointmentRow({ id: "2", scheduled_slot: "AM", status: "SCHEDULED" }),
    ];
    expect(groupAppointmentsBySlot(rows)).toEqual([["AM", rows]]);
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

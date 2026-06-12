import { describe, expect, it } from "vitest";
import {
  canCompleteOrder,
  canStartTrip,
  canonicalOrderStatus,
  matchesDriverBucket,
  orderBucket,
  orderStatusLabel,
  resolveEffectiveOrderStatus,
} from "@/src/lib/orderStatus";

describe("orderStatus", () => {
  it("canonicalizes legacy API codes", () => {
    expect(canonicalOrderStatus("started")).toBe("en_route");
    expect(canonicalOrderStatus("enroute")).toBe("en_route");
    expect(canonicalOrderStatus("cancelled")).toBe("canceled");
    expect(orderStatusLabel("started")).toBe("En Route");
  });

  it("maps statuses into driver buckets", () => {
    expect(orderBucket("dispatched")).toBe("assigned");
    expect(orderBucket("started")).toBe("active");
    expect(orderBucket("en_route")).toBe("active");
    expect(orderBucket("delivered")).toBe("active");
    expect(orderBucket("completed")).toBe("completed");
    expect(matchesDriverBucket("en_route", "active")).toBe(true);
  });

  it("guards workflow actions by status", () => {
    expect(canStartTrip("dispatched")).toBe(true);
    expect(canStartTrip({ status: "created", dispatched: true })).toBe(true);
    expect(canStartTrip({ status: "created", started: true })).toBe(false);
    expect(canStartTrip("en_route")).toBe(false);
    expect(canCompleteOrder("en_route")).toBe(true);
    expect(canCompleteOrder("delivered")).toBe(true);
    expect(canCompleteOrder("dispatched")).toBe(false);
  });

  it("maps started flag to en_route for assigned orders", () => {
    expect(
      resolveEffectiveOrderStatus({ status: "dispatched", started: true, started_at: "2026-01-01" })
    ).toBe("en_route");
  });

  it("maps driver assignment to assigned before dispatch", () => {
    expect(
      resolveEffectiveOrderStatus({
        status: "created",
        driver_assigned_uuid: "driver_123",
        dispatched: false,
      })
    ).toBe("assigned");
  });
});

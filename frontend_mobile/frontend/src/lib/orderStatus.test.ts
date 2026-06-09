import { describe, expect, it } from "vitest";
import {
  canCompleteOrder,
  canStartTrip,
  matchesDriverBucket,
  orderBucket,
  resolveEffectiveOrderStatus,
} from "@/src/lib/orderStatus";

describe("orderStatus", () => {
  it("maps statuses into driver buckets", () => {
    expect(orderBucket("dispatched")).toBe("assigned");
    expect(orderBucket("started")).toBe("active");
    expect(orderBucket("completed")).toBe("completed");
    expect(matchesDriverBucket("en_route", "active")).toBe(true);
  });

  it("guards workflow actions by status", () => {
    expect(canStartTrip("dispatched")).toBe(true);
    expect(canStartTrip({ status: "created", dispatched: true })).toBe(true);
    expect(canStartTrip({ status: "created", started: true })).toBe(false);
    expect(canStartTrip("started")).toBe(false);
    expect(canCompleteOrder("started")).toBe(true);
    expect(canCompleteOrder("dispatched")).toBe(false);
  });

  it("maps started flag to started status for assigned orders", () => {
    expect(
      resolveEffectiveOrderStatus({ status: "dispatched", started: true, started_at: "2026-01-01" })
    ).toBe("started");
  });
});

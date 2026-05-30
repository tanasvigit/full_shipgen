import { describe, expect, it } from "vitest";
import {
  canCompleteOrder,
  canStartTrip,
  matchesDriverBucket,
  orderBucket,
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
    expect(canStartTrip("started")).toBe(false);
    expect(canCompleteOrder("started")).toBe(true);
    expect(canCompleteOrder("dispatched")).toBe(false);
  });
});

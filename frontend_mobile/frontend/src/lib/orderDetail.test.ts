import { describe, expect, it } from "vitest";
import { orderNeedsCoordinateRefresh } from "@/src/lib/orderDetail";
import type { Order } from "@/src/data/types";

function order(partial: Partial<Order>): Order {
  return {
    id: "1",
    code: "ORD-1",
    customer: "Acme",
    pickup: "—",
    dropoff: "—",
    status: "created",
    ...partial,
  };
}

describe("orderNeedsCoordinateRefresh", () => {
  it("returns false when order is missing", () => {
    expect(orderNeedsCoordinateRefresh(null)).toBe(false);
    expect(orderNeedsCoordinateRefresh(undefined)).toBe(false);
  });

  it("returns false when addresses are placeholders without coordinates", () => {
    expect(orderNeedsCoordinateRefresh(order({ pickup: "—", dropoff: "—" }))).toBe(false);
  });

  it("returns true when address exists but coordinates are missing", () => {
    expect(
      orderNeedsCoordinateRefresh(
        order({ pickup: "123 Main St", dropoff: "456 Oak Ave", pickupCoordinate: null, dropoffCoordinate: null })
      )
    ).toBe(true);
  });

  it("returns false when at least one coordinate is present", () => {
    expect(
      orderNeedsCoordinateRefresh(
        order({
          pickup: "123 Main St",
          dropoff: "456 Oak Ave",
          pickupCoordinate: { latitude: 1, longitude: 2 },
        })
      )
    ).toBe(false);
  });
});

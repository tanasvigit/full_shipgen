import { describe, expect, it } from "vitest";
import {
  canAssignOrder,
  canCancelOrderAction,
  canDispatchOrderAction,
  showOpsToolbar,
} from "@/src/lib/orderOps";
import type { Order } from "@/src/data/types";

const baseOrder: Order = {
  id: "ord-1",
  code: "ORD-1",
  customer: "Acme",
  pickup: "A",
  dropoff: "B",
  status: "created",
  driverId: "driver-1",
  vehicleId: "",
  amount: 0,
  distance: "—",
  scheduledAt: "—",
  createdAt: "—",
  items: [],
  timeline: [],
};

const perms = {
  canUpdateOrder: true,
  canDispatchOrder: true,
  canCreateOrder: true,
};

describe("orderOps", () => {
  it("hides ops toolbar for drivers", () => {
    expect(showOpsToolbar(baseOrder, perms, true)).toBe(false);
  });

  it("allows dispatch when driver is assigned and order is not dispatched", () => {
    expect(canDispatchOrderAction(baseOrder, perms, false)).toBe(true);
    expect(
      canDispatchOrderAction({ ...baseOrder, dispatched: true }, perms, false)
    ).toBe(false);
    expect(canDispatchOrderAction({ ...baseOrder, driverId: "" }, perms, false)).toBe(false);
  });

  it("allows assign and cancel for open ops orders", () => {
    expect(canAssignOrder(baseOrder, perms, false)).toBe(true);
    expect(canCancelOrderAction(baseOrder, perms, false)).toBe(true);
    expect(canAssignOrder({ ...baseOrder, status: "completed" }, perms, false)).toBe(false);
  });
});

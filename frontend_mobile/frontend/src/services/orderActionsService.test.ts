import { describe, expect, it, vi, beforeEach } from "vitest";
import { orderActionsService } from "@/src/services/orderActionsService";

vi.mock("@/src/lib/api", () => ({
  apiRequest: vi.fn(),
  unwrapEntity: vi.fn((payload: unknown, keys: string[]) => {
    const record = payload as Record<string, unknown>;
    for (const key of keys) {
      if (record[key]) return record[key];
    }
    return null;
  }),
  unwrapList: vi.fn((payload: unknown, keys: string[]) => {
    const record = payload as Record<string, unknown>;
    for (const key of keys) {
      if (Array.isArray(record[key])) return record[key];
    }
    return [];
  }),
}));

vi.mock("@/src/lib/orderMapper", () => ({
  mapBackendOrder: vi.fn((dto: { uuid: string; public_id?: string }) => ({
    id: dto.uuid,
    code: dto.public_id || dto.uuid,
    customer: "Test",
    pickup: "A",
    dropoff: "B",
    status: "created",
    driverId: "",
    vehicleId: "",
    amount: 0,
    distance: "—",
    scheduledAt: "—",
    createdAt: "—",
    items: [],
    timeline: [],
  })),
}));

import { apiRequest } from "@/src/lib/api";

describe("orderActionsService", () => {
  beforeEach(() => {
    vi.mocked(apiRequest).mockReset();
  });

  it("rejects missing order ref on assign", async () => {
    await expect(
      orderActionsService.assignDriverAndVehicle("", { driverId: "driver-1" })
    ).rejects.toThrow("Order reference is missing");
  });

  it("dispatches with internal transition endpoint", async () => {
    vi.mocked(apiRequest).mockResolvedValue({ status: "OK" });
    await orderActionsService.dispatch("ord-1");
    expect(apiRequest).toHaveBeenCalledWith("/orders/dispatch", {
      method: "PATCH",
      body: { order: "ord-1" },
    });
  });

  it("assigns driver and vehicle via order patch", async () => {
    vi.mocked(apiRequest).mockResolvedValue({ order: { uuid: "ord-1", public_id: "ORD-1" } });
    await orderActionsService.assignDriverAndVehicle("ord-1", {
      driverId: "driver-1",
      vehicleId: "veh-1",
    });
    expect(apiRequest).toHaveBeenCalledWith("/orders/ord-1", {
      method: "PATCH",
      body: {
        order: {
          driver_assigned_uuid: "driver-1",
          driver: "driver-1",
          vehicle_assigned_uuid: "veh-1",
        },
      },
    });
  });

  it("falls back when order-configs list is empty", async () => {
    vi.mocked(apiRequest)
      .mockResolvedValueOnce({ order_configs: [] })
      .mockResolvedValueOnce({ uuid: "cfg-2", namespace: "system:order-config:transport" });

    const config = await orderActionsService.getDefaultOrderConfig();
    expect(config?.uuid).toBe("cfg-2");
    expect(apiRequest).toHaveBeenNthCalledWith(2, "/orders/default-config");
  });

  it("creates order without auto-dispatch", async () => {
    vi.mocked(apiRequest)
      .mockResolvedValueOnce({ order_configs: [{ uuid: "cfg-1", namespace: "system:order-config:transport" }] })
      .mockResolvedValueOnce({ order: { uuid: "ord-2", public_id: "ORD-2" } });

    const order = await orderActionsService.create({
      pickupPlaceId: "place-1",
      dropoffPlaceId: "place-2",
      customerLabel: "Acme",
    });

    expect(order.code).toBe("ORD-2");
    expect(apiRequest).toHaveBeenNthCalledWith(1, "/order-configs?limit=25");
    expect(apiRequest).toHaveBeenLastCalledWith("/orders", {
      method: "POST",
      body: {
        order: expect.objectContaining({
          order_config_uuid: "cfg-1",
          dispatched: false,
          payload: {
            pickup_uuid: "place-1",
            dropoff_uuid: "place-2",
          },
        }),
      },
    });
  });
});

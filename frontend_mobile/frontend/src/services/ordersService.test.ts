import { describe, expect, it, vi, beforeEach } from "vitest";
import { ORDER_INCLUDES, ORDERS_LIST_INCLUDES, ordersService } from "@/src/services/ordersService";

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
  mapBackendOrder: vi.fn((dto: { id: string; public_id?: string }) => ({
    id: dto.public_id || dto.id,
    code: dto.public_id || dto.id,
    customer: "Test",
    pickup: "A",
    dropoff: "B",
    status: "created",
  })),
}));

import { apiRequest } from "@/src/lib/api";

describe("ordersService includes", () => {
  it("uses the same relation graph for list and detail fetches", () => {
    expect(ORDER_INCLUDES).toBe(ORDERS_LIST_INCLUDES);
    expect(ORDER_INCLUDES).toContain("payload.pickup");
    expect(ORDER_INCLUDES).toContain("payload.dropoff");
    expect(ORDER_INCLUDES).toContain("driverAssigned");
    expect(ORDER_INCLUDES).toContain("vehicleAssigned");
  });
});

describe("ordersService.findById", () => {
  beforeEach(() => {
    vi.mocked(apiRequest).mockReset();
  });

  it("requests detail with ORDER_INCLUDES", async () => {
    vi.mocked(apiRequest).mockResolvedValue({ order: { id: "ord_1", public_id: "ORD-1" } });

    const result = await ordersService.findById("ord_1");

    expect(result?.id).toBe("ORD-1");
    expect(apiRequest).toHaveBeenCalledWith(expect.stringContaining("with="));
    expect(apiRequest).toHaveBeenCalledWith(expect.stringContaining(encodeURIComponent(ORDER_INCLUDES)));
  });

  it("falls back to order code when id lookup returns 404", async () => {
    vi.mocked(apiRequest)
      .mockRejectedValueOnce({ status: 404 })
      .mockResolvedValueOnce({ order: { id: "ord_2", public_id: "ORD-2" } });

    const result = await ordersService.findById("missing-id", { code: "ORD-2" });

    expect(result?.code).toBe("ORD-2");
    expect(apiRequest).toHaveBeenCalledTimes(2);
  });
});

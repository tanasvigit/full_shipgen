import { apiRequest, unwrapEntity, unwrapList } from "@/src/lib/api";
import { mapBackendOrder } from "@/src/lib/orderMapper";
import type { Order } from "@/src/data/types";
import type { OrderDTO } from "@/src/types/api/orders";

function normalizeOrderRefs(orderId: string, code?: string) {
  const refs = [String(orderId || "").trim(), String(code || "").trim()].filter(Boolean);
  return [...new Set(refs)];
}

const ORDER_INCLUDES =
  "driverAssigned,vehicleAssigned,driverAssigned.vehicle,payload,payload.pickup,payload.dropoff";

export const ordersService = {
  async list(params?: { limit?: number; driver?: string }) {
    const query = new URLSearchParams();
    query.set("limit", String(params?.limit ?? 500));
    query.set("with", ORDER_INCLUDES);
    if (params?.driver) query.set("driver", params.driver);
    const payload = await apiRequest(`/orders?${query.toString()}`);
    return unwrapList<OrderDTO>(payload, ["orders"]).map(mapBackendOrder);
  },

  async getByRef(orderRef: string) {
    const query = new URLSearchParams({ with: ORDER_INCLUDES });
    const payload = await apiRequest(`/orders/${encodeURIComponent(orderRef)}?${query.toString()}`);
    const entity = unwrapEntity<OrderDTO>(payload, ["order"]);
    return entity ? mapBackendOrder(entity) : null;
  },

  async findById(orderId: string, hints?: { code?: string }): Promise<Order | null> {
    const refs = normalizeOrderRefs(orderId, hints?.code);
    for (const ref of refs) {
      try {
        const order = await this.getByRef(ref);
        if (order) return order;
      } catch (error: unknown) {
        const status = (error as { status?: number })?.status;
        if (status !== 404) throw error;
      }
    }
    return null;
  },

  async getEta(orderRef: string) {
    return apiRequest(`/orders/${encodeURIComponent(orderRef)}/eta`);
  },

  async getTracker(orderRef: string) {
    return apiRequest(`/orders/${encodeURIComponent(orderRef)}/tracker`);
  },

  async getProofs(orderRef: string, subjectId?: string) {
    const suffix = subjectId
      ? `/proofs/${encodeURIComponent(subjectId)}`
      : "/proofs";
    const payload = await apiRequest(`/orders/${encodeURIComponent(orderRef)}${suffix}`);
    return unwrapList(payload, ["proofs", "data"]);
  },
};


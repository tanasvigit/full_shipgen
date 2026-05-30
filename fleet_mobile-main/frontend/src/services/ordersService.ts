import { apiRequest, unwrapEntity, unwrapList } from "@/src/lib/api";
import { mapBackendOrder } from "@/src/lib/orderMapper";
import type { Order } from "@/src/data/types";
import type { OrderDTO } from "@/src/types/api/orders";

function normalizeOrderRefs(orderId: string, code?: string) {
  const refs = [String(orderId || "").trim(), String(code || "").trim()].filter(Boolean);
  return [...new Set(refs)];
}

export const ordersService = {
  async list(params?: { limit?: number }) {
    const limit = params?.limit ?? 500;
    const payload = await apiRequest(`/orders?limit=${limit}`);
    return unwrapList<OrderDTO>(payload, ["orders"]).map(mapBackendOrder);
  },

  async getByRef(orderRef: string) {
    const payload = await apiRequest(`/orders/${encodeURIComponent(orderRef)}`);
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
};


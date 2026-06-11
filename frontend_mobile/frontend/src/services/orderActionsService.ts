import { apiRequest, unwrapEntity, unwrapList } from "@/src/lib/api";
import { mapBackendOrder } from "@/src/lib/orderMapper";
import type { Order } from "@/src/data/types";

export type CreateOrderInput = {
  pickupPlaceId: string;
  dropoffPlaceId: string;
  customerLabel?: string;
  driverId?: string;
  vehicleId?: string;
  notes?: string;
};

function orderBody(patch: Record<string, unknown>) {
  return { order: patch };
}

function requireOrderRef(orderRef: string) {
  const ref = String(orderRef || "").trim();
  if (!ref || ref === "undefined") {
    throw new Error("Order reference is missing. Pull to refresh and try again.");
  }
  return ref;
}

function isIdempotentTransitionError(kind: "dispatch" | "cancel", error: unknown) {
  const status = (error as { status?: number })?.status;
  const message = String((error as Error)?.message || "").toLowerCase();
  if (status !== 400 && status !== 409 && status !== 422) return false;
  if (kind === "dispatch") {
    return message.includes("already been dispatched") || message.includes("already dispatched");
  }
  return message.includes("already canceled") || message.includes("already cancelled");
}

function configUuid(config: Record<string, unknown> | null | undefined) {
  if (!config) return "";
  return String(config.uuid || config.id || "");
}

export const orderActionsService = {
  async getDefaultOrderConfig() {
    try {
      const listPayload = await apiRequest("/order-configs?limit=25");
      const list = unwrapList<Record<string, unknown>>(listPayload, [
        "order_configs",
        "orderConfigs",
        "order-configs",
      ]);
      const transport = list.find((row) =>
        String(row.namespace || "").includes("system:order-config:transport")
      );
      if (transport) return transport;
      if (list[0]) return list[0];
    } catch {
      // fall through to legacy endpoint
    }

    try {
      const payload = await apiRequest("/orders/default-config");
      const entity = unwrapEntity<Record<string, unknown>>(payload, [
        "order_config",
        "orderConfig",
        "config",
      ]);
      if (entity && configUuid(entity)) return entity;
      if (payload && typeof payload === "object" && configUuid(payload as Record<string, unknown>)) {
        return payload as Record<string, unknown>;
      }
    } catch {
      // endpoint may 500 when company has no seeded transport config
    }

    return null;
  },

  async assignDriverAndVehicle(
    orderId: string,
    input: { driverId: string; vehicleId?: string }
  ) {
    const ref = requireOrderRef(orderId);
    const patch: Record<string, unknown> = {
      driver_assigned_uuid: input.driverId,
      driver: input.driverId,
    };
    if (input.vehicleId) {
      patch.vehicle_assigned_uuid = input.vehicleId;
    }
    return this.patchOrder(ref, patch);
  },

  async unassignDriver(orderId: string) {
    return this.patchOrder(requireOrderRef(orderId), {
      driver_assigned_uuid: null,
      vehicle_assigned_uuid: null,
    });
  },

  async patchOrder(orderId: string, patch: Record<string, unknown>) {
    const ref = requireOrderRef(orderId);
    const payload = await apiRequest(`/orders/${encodeURIComponent(ref)}`, {
      method: "PATCH",
      body: orderBody(patch),
    });
    const entity = unwrapEntity(payload, ["order"]);
    return entity ? mapBackendOrder(entity) : null;
  },

  async dispatch(orderId: string) {
    const ref = requireOrderRef(orderId);
    try {
      await apiRequest("/orders/dispatch", {
        method: "PATCH",
        body: { order: ref },
      });
    } catch (error) {
      if (!isIdempotentTransitionError("dispatch", error)) throw error;
    }
  },

  async cancel(orderId: string) {
    const ref = requireOrderRef(orderId);
    try {
      await apiRequest("/orders/cancel", {
        method: "PATCH",
        body: { order: ref },
      });
    } catch (error) {
      if (!isIdempotentTransitionError("cancel", error)) throw error;
    }
  },

  async create(input: CreateOrderInput): Promise<Order> {
    const config = await this.getDefaultOrderConfig();
    const orderConfigUuid = configUuid(config);
    if (!orderConfigUuid) {
      throw new Error(
        "No order configuration found. Add an order config in Fleetbase console (Settings → Order configs) and try again."
      );
    }

    const body = orderBody({
      order_config_uuid: orderConfigUuid,
      type: "default",
      status: "created",
      dispatched: false,
      notes: input.notes?.trim() || undefined,
      internal_id: input.customerLabel?.trim() || undefined,
      ...(input.driverId
        ? { driver_assigned_uuid: input.driverId, driver: input.driverId }
        : {}),
      ...(input.vehicleId ? { vehicle_assigned_uuid: input.vehicleId } : {}),
      payload: {
        pickup_uuid: input.pickupPlaceId,
        dropoff_uuid: input.dropoffPlaceId,
      },
    });

    const payload = await apiRequest("/orders", { method: "POST", body });
    const entity = unwrapEntity(payload, ["order"]);
    if (!entity) throw new Error("Order was created but the API returned an empty response.");
    return mapBackendOrder(entity);
  },
};

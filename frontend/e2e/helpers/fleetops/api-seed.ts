import type { APIRequestContext } from "@playwright/test";
import { apiLogin } from "../api";
import { requireCredentials } from "../env";

const DEFAULT_FLOW = {
  activities: [
    { code: "created", status: "created", activities: ["dispatched"], logic: [], events: ["order.created"] },
    { code: "dispatched", status: "dispatched", activities: ["started"], logic: [], events: ["order.dispatched"] },
    { code: "started", status: "en_route", activities: ["completed"], logic: [], events: ["order.started"] },
    { code: "completed", status: "completed", activities: [], logic: [], events: ["order.completed"] },
    { code: "canceled", status: "canceled", activities: [], logic: [], events: ["order.canceled"] },
  ],
};

type ApiHeaders = Record<string, string>;

function unwrapList(payload: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = payload[key];
    if (Array.isArray(value)) return value;
  }
  if (Array.isArray(payload.data)) return payload.data;
  return [];
}

function unwrapEntity(payload: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = payload[key];
    if (value && typeof value === "object") return value as Record<string, unknown>;
  }
  return payload;
}

export async function getApiSession(request: APIRequestContext) {
  const { email, password } = requireCredentials();
  const session = await apiLogin(request, email, password);
  if (!session.organization?.id) {
    throw new Error("E2E user has no organization — complete onboarding first.");
  }
  const headers: ApiHeaders = {
    Authorization: `Bearer ${session.token}`,
    Accept: "application/json",
    "Content-Type": "application/json",
    "X-Company": session.organization.id,
  };
  return { session, headers };
}

export async function ensureOrderConfig(request: APIRequestContext, headers: ApiHeaders) {
  const { apiURL } = await import("../env").then((m) => m.getE2EConfig());
  const listRes = await request.get(`${apiURL}/order-configs?limit=1`, { headers });
  if (!listRes.ok()) {
    throw new Error(`order-configs list failed (${listRes.status()})`);
  }
  const listJson = (await listRes.json()) as Record<string, unknown>;
  const existing = unwrapList(listJson, ["order_configs", "orderConfigs"])[0] as
    | Record<string, unknown>
    | undefined;
  if (existing?.uuid) return String(existing.uuid);

  const stamp = Date.now();
  const createRes = await request.post(`${apiURL}/order-configs`, {
    headers,
    data: {
      orderConfig: {
        name: `E2E Default ${stamp}`,
        key: `e2e_default_${stamp}`,
        type: "default",
        status: "active",
        flow: DEFAULT_FLOW,
        meta: {},
      },
    },
  });
  if (!createRes.ok()) {
    throw new Error(`order-config create failed (${createRes.status()}): ${await createRes.text()}`);
  }
  const created = unwrapEntity((await createRes.json()) as Record<string, unknown>, ["order_config"]);
  return String(created.uuid);
}

export async function createOrdersViaApi(
  request: APIRequestContext,
  count: number,
  options: { autoDispatch?: boolean } = {},
): Promise<Array<{ orderId: string; publicId: string; internalId: string }>> {
  const autoDispatch = options.autoDispatch !== false;
  const { apiURL } = await import("../env").then((m) => m.getE2EConfig());
  const { headers } = await getApiSession(request);
  const orderConfigUuid = await ensureOrderConfig(request, headers);

  const placesRes = await request.get(`${apiURL}/places?limit=2`, { headers });
  if (!placesRes.ok()) throw new Error(`places list failed (${placesRes.status()})`);
  const places = unwrapList((await placesRes.json()) as Record<string, unknown>, ["places"]);
  if (places.length < 1) {
    throw new Error("Need at least one place — create pickup/dropoff places in FleetOps first.");
  }
  const pickupUuid = String((places[0] as Record<string, unknown>).uuid);
  const dropoffUuid = String((places[1] as Record<string, unknown> | undefined)?.uuid || pickupUuid);

  const driversRes = await request.get(`${apiURL}/drivers?limit=1`, { headers });
  const drivers = driversRes.ok()
    ? unwrapList((await driversRes.json()) as Record<string, unknown>, ["drivers"])
    : [];
  const driverUuid = drivers[0] ? String((drivers[0] as Record<string, unknown>).uuid || "") : "";

  const created: Array<{ orderId: string; publicId: string; internalId: string }> = [];
  const runId = Date.now();

  for (let i = 1; i <= count; i += 1) {
    const internalId = `E2E-5ORD-${runId}-${i}`;
    const body = {
      order: {
        order_config_uuid: orderConfigUuid,
        type: "default",
        internal_id: internalId,
        dispatched: autoDispatch,
        payload: {
          pickup_uuid: pickupUuid,
          dropoff_uuid: dropoffUuid,
        },
        ...(driverUuid ? { driver_assigned_uuid: driverUuid } : {}),
      },
    };

    let res = await request.post(`${apiURL}/orders`, { headers, data: body });
    if (!res.ok()) {
      res = await request.post(`${apiURL}/fleet-ops/orders`, { headers, data: body });
    }
    if (!res.ok()) {
      throw new Error(`Create order ${i} failed (${res.status()}): ${await res.text()}`);
    }

    const order = unwrapEntity((await res.json()) as Record<string, unknown>, ["order"]);
    const orderId = String(order.uuid || order.public_id || order.id || "");
    const publicId = String(order.public_id || orderId);
    created.push({ orderId, publicId, internalId });
  }

  return created;
}

export async function getOrderViaApi(request: APIRequestContext, orderId: string) {
  const { apiURL } = await import("../env").then((m) => m.getE2EConfig());
  const { headers } = await getApiSession(request);
  const res = await request.get(`${apiURL}/orders/${orderId}`, { headers });
  if (!res.ok()) {
    throw new Error(`get order failed (${res.status()}): ${await res.text()}`);
  }
  return unwrapEntity((await res.json()) as Record<string, unknown>, ["order"]);
}

export async function dispatchOrderViaApi(request: APIRequestContext, orderId: string) {
  const { apiURL } = await import("../env").then((m) => m.getE2EConfig());
  const { headers } = await getApiSession(request);
  const res = await request.patch(`${apiURL}/orders/dispatch`, {
    headers,
    data: { order: orderId },
  });
  if (!res.ok()) {
    const text = await res.text();
    if (text.toLowerCase().includes("already been dispatched")) return { already: true };
    throw new Error(`dispatch failed (${res.status()}): ${text}`);
  }
  return (await res.json()) as Record<string, unknown>;
}

export async function createWorkflowTestOrder(request: APIRequestContext) {
  const created = await createOrdersViaApi(request, 1, { autoDispatch: false });
  const row = created[0];
  if (!row?.orderId) throw new Error("Failed to seed workflow test order");
  return row;
}

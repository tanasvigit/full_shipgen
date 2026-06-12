import type { APIRequestContext } from "@playwright/test";
import { getApiSession, ensureOrderConfig } from "./api-seed";
import { e2eUnique } from "./test-data";

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

function unwrapNestedList(payload: Record<string, unknown>, keys: string[]) {
  const direct = unwrapList(payload, keys);
  if (direct.length) return direct;
  const inner = payload.data;
  if (inner && typeof inner === "object" && !Array.isArray(inner)) {
    return unwrapList(inner as Record<string, unknown>, keys);
  }
  return [];
}

async function apiConfig() {
  const { getE2EConfig } = await import("../env");
  return getE2EConfig();
}

export type ContactVendorSeed = {
  uuid: string;
  publicId: string;
  name: string;
  email: string;
  type: string;
};

export async function createContactViaApi(
  request: APIRequestContext,
  options: { type?: string; seed?: ReturnType<typeof e2eUnique> } = {},
): Promise<ContactVendorSeed> {
  const { apiURL } = await apiConfig();
  const { headers } = await getApiSession(request);
  const seed = options.seed || e2eUnique("Contact");
  const type = options.type || "contact";

  const res = await request.post(`${apiURL}/contacts`, {
    headers,
    data: {
      contact: {
        name: seed.name,
        email: seed.email,
        phone: seed.phone,
        type,
      },
    },
  });
  if (!res.ok()) {
    throw new Error(`create contact failed (${res.status()}): ${await res.text()}`);
  }

  const row = unwrapEntity((await res.json()) as Record<string, unknown>, ["contact"]);
  return {
    uuid: String(row.uuid),
    publicId: String(row.public_id || row.uuid),
    name: String(row.name),
    email: String(row.email || seed.email),
    type: String(row.type || type),
  };
}

export async function createVendorViaApi(
  request: APIRequestContext,
  options: { type?: string; seed?: ReturnType<typeof e2eUnique> } = {},
): Promise<ContactVendorSeed> {
  const { apiURL } = await apiConfig();
  const { headers } = await getApiSession(request);
  const seed = options.seed || e2eUnique("Vendor");
  const type = options.type || "facilitator";

  const res = await request.post(`${apiURL}/vendors`, {
    headers,
    data: {
      vendor: {
        name: seed.name,
        email: seed.email,
        phone: seed.phone,
        type,
        country: "US",
      },
    },
  });
  if (!res.ok()) {
    throw new Error(`create vendor failed (${res.status()}): ${await res.text()}`);
  }

  const row = unwrapEntity((await res.json()) as Record<string, unknown>, ["vendor"]);
  return {
    uuid: String(row.uuid),
    publicId: String(row.public_id || row.uuid),
    name: String(row.name),
    email: String(row.email || seed.email),
    type: String(row.type || type),
  };
}

export async function listMorphCustomersViaApi(request: APIRequestContext) {
  const { apiURL } = await apiConfig();
  const { headers } = await getApiSession(request);
  const res = await request.get(`${apiURL}/query/customers`, { headers, params: { limit: 50 } });
  if (!res.ok()) {
    throw new Error(`query/customers failed (${res.status()}): ${await res.text()}`);
  }
  return unwrapNestedList((await res.json()) as Record<string, unknown>, ["customers", "data"]);
}

export async function listMorphFacilitatorsViaApi(request: APIRequestContext) {
  const { apiURL } = await apiConfig();
  const { headers } = await getApiSession(request);
  const res = await request.get(`${apiURL}/query/facilitators`, { headers, params: { limit: 50 } });
  if (!res.ok()) {
    throw new Error(`query/facilitators failed (${res.status()}): ${await res.text()}`);
  }
  return unwrapNestedList((await res.json()) as Record<string, unknown>, ["facilitators", "data"]);
}

export async function listCustomersViaApi(request: APIRequestContext) {
  const { apiURL } = await apiConfig();
  const { headers } = await getApiSession(request);
  const res = await request.get(`${apiURL}/customers`, { headers, params: { limit: 50, type: "contact" } });
  if (!res.ok()) {
    throw new Error(`GET /customers failed (${res.status()}): ${await res.text()}`);
  }
  return unwrapNestedList((await res.json()) as Record<string, unknown>, ["customers", "data"]);
}

export async function createOrderWithPartiesViaApi(
  request: APIRequestContext,
  options: {
    customerUuid: string;
    facilitatorUuid: string;
    usePublicIds?: boolean;
    customer?: ContactVendorSeed;
    facilitator?: ContactVendorSeed;
  },
) {
  const { apiURL } = await apiConfig();
  const { headers } = await getApiSession(request);
  const orderConfigUuid = await ensureOrderConfig(request, headers);

  const placesRes = await request.get(`${apiURL}/places?limit=2`, { headers });
  if (!placesRes.ok()) throw new Error(`places list failed (${placesRes.status()})`);
  const places = unwrapList((await placesRes.json()) as Record<string, unknown>, ["places"]);
  if (!places.length) throw new Error("Need at least one place for order party test.");
  const pickupUuid = String((places[0] as Record<string, unknown>).uuid);
  const dropoffUuid = String((places[1] as Record<string, unknown> | undefined)?.uuid || pickupUuid);

  const customerRef = options.usePublicIds
    ? options.customer?.publicId || options.customerUuid
    : options.customerUuid;
  const facilitatorRef = options.usePublicIds
    ? options.facilitator?.publicId || options.facilitatorUuid
    : options.facilitatorUuid;

  const internalId = `E2E-PARTY-${Date.now()}`;
  const body = {
    order: {
      order_config_uuid: orderConfigUuid,
      type: "default",
      internal_id: internalId,
      dispatched: false,
      customer: customerRef,
      facilitator: facilitatorRef,
      payload: {
        pickup_uuid: pickupUuid,
        dropoff_uuid: dropoffUuid,
      },
    },
  };

  let res = await request.post(`${apiURL}/orders`, { headers, data: body });
  if (!res.ok()) {
    res = await request.post(`${apiURL}/fleet-ops/orders`, { headers, data: body });
  }
  if (!res.ok()) {
    throw new Error(`create order with parties failed (${res.status()}): ${await res.text()}`);
  }

  return unwrapEntity((await res.json()) as Record<string, unknown>, ["order"]);
}

export async function assignDriverToVendorViaApi(
  request: APIRequestContext,
  vendorUuid: string,
  driverUuid: string,
) {
  const { apiURL } = await apiConfig();
  const { headers } = await getApiSession(request);
  const res = await request.post(`${apiURL}/vendors/${vendorUuid}/assign-driver`, {
    headers,
    data: { driver: driverUuid },
  });
  if (!res.ok()) {
    throw new Error(`assign driver to vendor failed (${res.status()}): ${await res.text()}`);
  }
}

export async function getDriverViaApi(request: APIRequestContext, driverUuid: string) {
  const { apiURL } = await apiConfig();
  const { headers } = await getApiSession(request);
  const res = await request.get(`${apiURL}/drivers/${driverUuid}`, { headers });
  if (!res.ok()) {
    throw new Error(`get driver failed (${res.status()}): ${await res.text()}`);
  }
  return unwrapEntity((await res.json()) as Record<string, unknown>, ["driver"]);
}

export async function getFirstDriverUuid(request: APIRequestContext): Promise<string | null> {
  const { apiURL } = await apiConfig();
  const { headers } = await getApiSession(request);
  const res = await request.get(`${apiURL}/drivers?limit=1`, { headers });
  if (!res.ok()) return null;
  const drivers = unwrapList((await res.json()) as Record<string, unknown>, ["drivers"]);
  const row = drivers[0] as Record<string, unknown> | undefined;
  return row?.uuid ? String(row.uuid) : null;
}

export async function deleteContactViaApi(request: APIRequestContext, id: string) {
  const { apiURL } = await apiConfig();
  const { headers } = await getApiSession(request);
  await request.delete(`${apiURL}/contacts/${id}`, { headers });
}

export async function deleteVendorViaApi(request: APIRequestContext, id: string) {
  const { apiURL } = await apiConfig();
  const { headers } = await getApiSession(request);
  await request.delete(`${apiURL}/vendors/${id}`, { headers });
}

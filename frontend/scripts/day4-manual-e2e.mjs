#!/usr/bin/env node
/**
 * Day 4 manual E2E helper — API prep + status checks for:
 * Console dispatch → Mobile receive → Start trip → Complete → Console realtime verify
 *
 * Usage (from frontend/):
 *   node scripts/day4-manual-e2e.mjs prep
 *   node scripts/day4-manual-e2e.mjs status <order-id>
 *   node scripts/day4-manual-e2e.mjs mobile-simulate <order-id>   # optional API-only mobile leg
 */

import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

for (const file of [path.join(root, "e2e", ".env"), path.join(root, ".env")]) {
  if (fs.existsSync(file)) dotenv.config({ path: file, override: false });
}

const apiHost = (process.env.E2E_API_URL || process.env.VITE_API_HOST || "http://localhost:8000").replace(/\/$/, "");
const apiNS = (process.env.E2E_API_NAMESPACE || process.env.VITE_API_NAMESPACE || "int/v1").replace(/^\/|\/$/g, "");
const apiURL = `${apiHost}/${apiNS}`;
const email = process.env.E2E_USER_EMAIL || "";
const password = process.env.E2E_USER_PASSWORD || "";
const consoleURL = process.env.E2E_BASE_URL || "http://localhost:5173";

function fail(msg) {
  console.error(`\n❌ ${msg}\n`);
  process.exit(1);
}

async function request(method, urlPath, { token, companyId, body } = {}) {
  const headers = {
    Accept: "application/json",
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(companyId ? { "X-Company": companyId } : {}),
  };
  const res = await fetch(`${apiURL}${urlPath}`, {
    method,
    headers,
    body: body != null ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = { raw: text };
  }
  return { ok: res.ok, status: res.status, json };
}

function unwrapList(payload, keys = []) {
  if (Array.isArray(payload)) return payload;
  for (const k of keys) {
    if (Array.isArray(payload?.[k])) return payload[k];
  }
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
}

function unwrapEntity(payload, keys = []) {
  if (payload && !keys.some((k) => k in (payload || {})) && payload.uuid) return payload;
  for (const k of keys) {
    if (payload?.[k]) return payload[k];
  }
  return payload;
}

function orderId(order) {
  return String(order?.uuid || order?.id || order?.public_id || "");
}

function orderStatus(order) {
  return String(order?.status || order?.status_code || "unknown").toLowerCase();
}

async function login() {
  if (!email || !password) {
    fail("Set E2E_USER_EMAIL and E2E_USER_PASSWORD in frontend/e2e/.env");
  }
  const login = await request("POST", "/auth/login", {
    body: { identity: email, password, remember: true },
  });
  if (!login.ok) fail(`Login failed (${login.status}): ${JSON.stringify(login.json)}`);
  const token = login.json?.token;
  if (!token) fail("No token from login");

  const me = await request("GET", "/users/me", { token });
  if (!me.ok) fail(`users/me failed (${me.status})`);

  const orgs = await request("GET", "/auth/organizations", { token });
  const orgList = Array.isArray(orgs.json)
    ? orgs.json
    : unwrapList(orgs.json, ["organizations", "companies"]);
  const companyId = String(orgList[0]?.uuid || orgList[0]?.id || "");
  if (!companyId) fail("No organization on account");

  return { token, companyId, user: unwrapEntity(me.json, ["user"]) };
}

async function listPlaces(token, companyId) {
  for (const path of ["/places?limit=5", "/fleet-ops/places?limit=5"]) {
    const res = await request("GET", path, { token, companyId });
    if (res.ok) {
      const rows = unwrapList(res.json, ["places"]);
      if (rows.length >= 2) return rows;
    }
  }
  return [];
}

async function listDrivers(token, companyId) {
  for (const path of ["/drivers?limit=20", "/fleet-ops/drivers?limit=20"]) {
    const res = await request("GET", path, { token, companyId });
    if (res.ok) {
      const rows = unwrapList(res.json, ["drivers"]);
      if (rows.length) return rows;
    }
  }
  return [];
}

async function getOrder(token, companyId, id) {
  const res = await request("GET", `/orders/${id}`, { token, companyId });
  if (!res.ok) return null;
  return unwrapEntity(res.json, ["order"]);
}

async function getDefaultOrderConfig(token, companyId) {
  const res = await request("GET", "/orders/default-config", { token, companyId });
  if (!res.ok) return null;
  return res.json;
}

async function createAndDispatch(token, companyId) {
  const config = await getDefaultOrderConfig(token, companyId);
  if (!config?.uuid) fail("No default order config. Open FleetOps → Order config and save a default flow.");

  const places = await listPlaces(token, companyId);
  if (places.length < 2) {
    fail("Need at least 2 places in FleetOps. Create pickup/dropoff places in console first.");
  }
  const pickup = places[0];
  const dropoff = places[1];
  const pickupId = pickup.uuid || pickup.id;
  const dropoffId = dropoff.uuid || dropoff.id;

  const drivers = await listDrivers(token, companyId);
  if (!drivers.length) fail("No drivers found. Create a driver in FleetOps → Drivers.");
  const driver = drivers[0];
  const driverId = driver.uuid || driver.id;

  const internalId = `DAY4-${Date.now().toString(36).toUpperCase()}`;
  const createBody = {
    order: {
      order_config_uuid: config.uuid,
      type: config.key || config.type || "default",
      internal_id: internalId,
      payload: {
        pickup_uuid: pickupId,
        dropoff_uuid: dropoffId,
      },
    },
  };

  let create = await request("POST", "/orders", { token, companyId, body: createBody });
  if (!create.ok) {
    create = await request("POST", "/fleet-ops/orders", { token, companyId, body: createBody });
  }
  if (!create.ok) fail(`Create order failed (${create.status}): ${JSON.stringify(create.json)}`);

  const order = unwrapEntity(create.json, ["order"]);
  const id = orderId(order);
  if (!id) fail("Created order but no id in response");

  const assign = await request("PATCH", `/orders/${id}`, {
    token,
    companyId,
    body: { driver_assigned_uuid: driverId },
  });
  if (!assign.ok) {
    await request("PATCH", `/fleet-ops/orders/${id}`, {
      token,
      companyId,
      body: { driver_assigned_uuid: driverId },
    });
  }

  let fresh = (await getOrder(token, companyId, id)) || order;
  let status = orderStatus(fresh);

  if (status !== "dispatched") {
    const bodyVariants = [{ order_uuid: id, id }, { orders: [id] }];
    let dispatched = false;
    for (const body of bodyVariants) {
      const bulk = await request("PATCH", "/orders/dispatch", { token, companyId, body });
      if (bulk.ok) {
        dispatched = true;
        break;
      }
    }
    if (!dispatched) {
      let dispatch = await request("PATCH", `/orders/${id}/dispatch`, { token, companyId, body: {} });
      if (!dispatch.ok) {
        dispatch = await request("POST", `/orders/${id}/dispatch`, { token, companyId, body: {} });
      }
      if (!dispatch.ok) {
        fresh = (await getOrder(token, companyId, id)) || fresh;
        status = orderStatus(fresh);
        if (status !== "dispatched") {
          fail(`Dispatch failed (${dispatch.status}): ${JSON.stringify(dispatch.json)}`);
        }
      }
    }
    fresh = (await getOrder(token, companyId, id)) || fresh;
  }
  return {
    id,
    internalId,
    status: orderStatus(fresh),
    driverName: driver.name || driver.public_id || driverId,
    driverId: String(driverId),
    driverEmail: driver.user?.email || driver.email || "(see Drivers → user email)",
    pickup: pickup.name || pickupId,
    dropoff: dropoff.name || dropoffId,
  };
}

async function tryWorkflow(token, companyId, id, action, method = "POST", body) {
  const paths = [`/orders/${id}/${action}`, `/fleet-ops/orders/${id}/${action}`];
  for (const p of paths) {
    for (const m of method === "GET" ? ["GET"] : ["POST", "PATCH"]) {
      const res = await request(m, p, { token, companyId, body });
      if (res.ok || res.status === 400) return res;
    }
  }
  return { ok: false, status: 0, json: null };
}

async function mobileSimulate(token, companyId, id) {
  console.log("\n--- API mobile leg (optional) ---\n");
  let order = await getOrder(token, companyId, id);
  console.log(`Before start: ${orderStatus(order)}`);

  const start = await tryWorkflow(token, companyId, id, "start");
  if (!start.ok) fail(`Start trip failed (${start.status}): ${JSON.stringify(start.json)}`);
  order = await getOrder(token, companyId, id);
  console.log(`After start: ${orderStatus(order)}`);

  const next = await tryWorkflow(token, companyId, id, "next-activity", "GET");
  if (next.ok && next.json) {
    const code = next.json?.code || next.json?.activity?.code;
    if (code) {
      await tryWorkflow(token, companyId, id, "update-activity", "POST", { code });
      order = await getOrder(token, companyId, id);
      console.log(`After advance (${code}): ${orderStatus(order)}`);
    }
  }

  const complete = await tryWorkflow(token, companyId, id, "complete");
  if (!complete.ok) fail(`Complete failed (${complete.status}): ${JSON.stringify(complete.json)}`);
  order = await getOrder(token, companyId, id);
  console.log(`After complete: ${orderStatus(order)}\n`);
}

function printRunbook(ctx) {
  const { id, internalId, status, driverName, driverId, driverEmail, consoleURL: base } = ctx;
  console.log(`
╔══════════════════════════════════════════════════════════════════╗
║  Day 4 — Manual E2E runbook (do in order)                        ║
╚══════════════════════════════════════════════════════════════════╝

Prereqs
  • API:    ${apiURL}
  • Console: ${base}  (npm run dev -- --host)
  • Mobile:  EXPO_PUBLIC_API_BASE_URL=${apiURL}
  • Mobile login (driver user): ${driverEmail}
  • Driver record: ${driverName} (${driverId})
  • Admin console login = ${email}

Prepared order (API)
  • ID: ${id}
  • Internal ref: ${internalId}
  • Status now: ${status} (should be "dispatched" after prep)

──────────────────────────────────────────────────────────────────
STEP 1 — Console dispatch (verify UI)
──────────────────────────────────────────────────────────────────
1. Open ${base}/fleet-ops/operations/orders
2. Search "${internalId}" or open order ${id}
3. Confirm status shows Dispatched and driver assigned
4. If not dispatched: select order → Dispatch → confirm toast

──────────────────────────────────────────────────────────────────
STEP 2 — Mobile receive
──────────────────────────────────────────────────────────────────
1. Open Expo app (same Wi‑Fi as API)
2. Sign in as the DRIVER user for ${driverName}
3. Assigned tab → pull to refresh
4. Open order ${internalId} — must appear

──────────────────────────────────────────────────────────────────
STEP 3 — Start trip
──────────────────────────────────────────────────────────────────
1. On order detail tap "Start trip"
2. Status → en_route / Active tab

──────────────────────────────────────────────────────────────────
STEP 4 — Complete
──────────────────────────────────────────────────────────────────
1. Advance activities if shown
2. Tap Complete (POD if prompted)
3. Order moves to Completed tab

──────────────────────────────────────────────────────────────────
STEP 5 — Console realtime verify
──────────────────────────────────────────────────────────────────
1. Console: keep order drawer open OR reopen from list
2. Activity timeline updates without full page reload
3. Status badge → completed
4. Optional: Dashboard / Fleet tracking map marker updates
5. DevTools → Network → WS connected (SocketCluster)

Verify status anytime:
  node scripts/day4-manual-e2e.mjs status ${id}
`);
}

async function main() {
  const cmd = process.argv[2] || "prep";
  const argId = process.argv[3];

  console.log(`API: ${apiURL}`);

  const { token, companyId } = await login();
  console.log("✓ API login OK\n");

  if (cmd === "status") {
    if (!argId) fail("Usage: node scripts/day4-manual-e2e.mjs status <order-id>");
    const order = await getOrder(token, companyId, argId);
    if (!order) fail(`Order not found: ${argId}`);
    console.log(`Order ${argId}: status=${orderStatus(order)} internal_id=${order.internal_id || "—"}`);
    return;
  }

  if (cmd === "mobile-simulate") {
    if (!argId) fail("Usage: node scripts/day4-manual-e2e.mjs mobile-simulate <order-id>");
    await mobileSimulate(token, companyId, argId);
    return;
  }

  if (cmd !== "prep") {
    fail(`Unknown command "${cmd}". Use: prep | status <id> | mobile-simulate <id>`);
  }

  const ctx = await createAndDispatch(token, companyId);
  printRunbook({ ...ctx, consoleURL });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

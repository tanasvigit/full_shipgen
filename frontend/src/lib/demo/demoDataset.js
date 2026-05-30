import { mapDriver, mapOrder } from "@/lib/mappers";

const BASE = { lat: 40.7128, lng: -74.006 };

function jitter(seed, scale = 0.02) {
  const x = Math.sin(seed * 12.9898) * 43758.5453;
  return (x - Math.floor(x)) * scale * 2 - scale;
}

function rawOrder(i, status, hoursAgo) {
  const created = new Date(Date.now() - hoursAgo * 3600000).toISOString();
  return {
    uuid: `demo-order-${i}`,
    public_id: `ORD-DEMO-${1000 + i}`,
    status,
    priority: i % 4 === 0 ? "high" : "medium",
    created_at: created,
    updated_at: created,
    customer: { name: `Demo Customer ${i}` },
    pickup_place: { name: "Brooklyn Depot", latitude: BASE.lat + jitter(i), longitude: BASE.lng + jitter(i + 1) },
    dropoff_place: { name: `Stop ${i}`, latitude: BASE.lat + jitter(i + 2, 0.04), longitude: BASE.lng + jitter(i + 3, 0.04) },
    distance: 12 + i,
    total: 45 + i * 3,
  };
}

function rawDriver(i, online) {
  return {
    uuid: `demo-driver-${i}`,
    public_id: `DRV-DEMO-${i}`,
    name: `Demo Driver ${i}`,
    status: online ? "online" : "offline",
    location: {
      latitude: BASE.lat + jitter(i, 0.06),
      longitude: BASE.lng + jitter(i + 5, 0.06),
    },
  };
}

let tick = 0;

export function getDemoOrders() {
  const statuses = ["created", "dispatched", "en_route", "delivered", "completed", "delayed"];
  return Array.from({ length: 18 }, (_, i) =>
    mapOrder(rawOrder(i + 1, statuses[i % statuses.length], 2 + i * 0.5)),
  );
}

export function getDemoDrivers() {
  return Array.from({ length: 6 }, (_, i) => mapDriver(rawDriver(i + 1, i < 4)));
}

/** Slightly move online drivers each tick for map demos. */
export function getDemoDriversAnimated() {
  tick += 1;
  return getDemoDrivers().map((d, i) => {
    if (d.status !== "online") return d;
    return {
      ...d,
      location: {
        ...d.location,
        lat: d.location.lat + jitter(tick + i, 0.008),
        lng: d.location.lng + jitter(tick + i + 7, 0.008),
      },
    };
  });
}

export const DEMO_RISKS = [
  { orderId: "demo-order-3", publicId: "ORD-DEMO-1003", level: "danger", message: "Delayed delivery — SLA at risk" },
  { orderId: "demo-order-7", publicId: "ORD-DEMO-1007", level: "warning", message: "Unassigned — awaiting driver" },
];

export const DEMO_SUGGESTIONS = [
  {
    id: "demo-suggest-1",
    type: "assign",
    priority: "high",
    title: "3 demo orders need drivers",
    detail: "Assign idle drivers in Brooklyn zone.",
    orderIds: ["demo-order-7", "demo-order-8"],
  },
];

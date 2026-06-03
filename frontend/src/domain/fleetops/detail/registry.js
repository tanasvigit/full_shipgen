import { getDetailExtensions } from "@/domain/fleetops/extensions/detailRegistry";
/**
 * FleetOps entity detail drawer registry — URLs, widths, tab contracts, extension hooks.
 */

export const FLEETOPS_DETAIL_ENTITIES = {
  driver: {
    key: "driver",
    param: "driver",
    label: "Driver",
    basePath: "/fleet-ops/management/drivers",
    width: 720,
    large: false,
    testId: "driver-detail-drawer",
  },
  vehicle: {
    key: "vehicle",
    param: "vehicle",
    label: "Vehicle",
    basePath: "/fleet-ops/management/vehicles",
    width: 720,
    large: false,
    testId: "vehicle-detail-drawer",
  },
  fleet: {
    key: "fleet",
    param: "fleet",
    label: "Fleet",
    basePath: "/fleet-ops/management/fleets",
    width: 720,
    large: false,
    testId: "fleet-detail-drawer",
  },
  place: {
    key: "place",
    param: "place",
    label: "Place",
    basePath: "/fleet-ops/management/places",
    width: 720,
    large: false,
    testId: "place-detail-drawer",
  },
  order: {
    key: "order",
    param: "order",
    label: "Order",
    basePath: "/fleet-ops/operations/orders",
    width: 720,
    large: false,
    testId: "order-detail-drawer",
  },
};

export function getEntityConfig(entityKey) {
  return FLEETOPS_DETAIL_ENTITIES[entityKey] || null;
}

export function resolveEntityFromSearchParams(searchParams) {
  for (const config of Object.values(FLEETOPS_DETAIL_ENTITIES)) {
    const id = searchParams.get(config.param);
    if (id) return { entity: config.key, entityId: id, config };
  }
  return { entity: null, entityId: null, config: null };
}

/** Extension point: plugins register extra tabs per entity key. */
const extensionTabs = new Map();

export function registerDetailTabs(entityKey, tabs) {
  extensionTabs.set(entityKey, tabs);
}

export function getExtensionTabs(entityKey) {
  const local = extensionTabs.get(entityKey) || [];
  const registered = getDetailExtensions(entityKey);
  const merged = [...local];
  for (const tab of registered) {
    const id = tab.id || tab.key;
    if (!merged.some((item) => (item.id || item.key) === id)) merged.push({ ...tab, id });
  }
  return merged;
}

export { registerRealtimeHandler } from "@/domain/fleetops/realtime/registry";

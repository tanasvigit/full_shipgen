import { getDetailExtensions } from "@/domain/fleetops/extensions/detailRegistry";
/**
 * FleetOps entity detail drawer registry — URLs, widths, tab contracts, extension hooks.
 */

/** Canonical right-side drawer width (Orders reference layout). */
export const FLEETOPS_DETAIL_DRAWER_WIDTH = 720;

export function normalizeDetailDrawerConfig(config) {
  if (!config) return null;
  return {
    ...config,
    width: FLEETOPS_DETAIL_DRAWER_WIDTH,
    large: false,
  };
}

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
  route: {
    key: "route",
    param: "route",
    label: "Route",
    basePath: "/fleet-ops/operations/routes",
    width: 720,
    large: false,
    testId: "route-detail-drawer",
  },
  vendor: {
    key: "vendor",
    param: "vendor",
    label: "Vendor",
    basePath: "/fleet-ops/management/vendors",
    width: 720,
    large: false,
    testId: "vendor-detail-drawer",
  },
  contact: {
    key: "contact",
    param: "contact",
    label: "Contact",
    basePath: "/fleet-ops/management/contacts",
    width: 720,
    large: false,
    testId: "contact-detail-drawer",
  },
  issue: {
    key: "issue",
    param: "issue",
    label: "Issue",
    basePath: "/fleet-ops/management/issues",
    width: 720,
    large: false,
    testId: "issue-detail-drawer",
  },
  fuelReport: {
    key: "fuelReport",
    param: "fuelReport",
    label: "Fuel report",
    basePath: "/fleet-ops/management/fuel-reports",
    width: 720,
    large: false,
    testId: "fuel-report-detail-drawer",
  },
  serviceRate: {
    key: "serviceRate",
    param: "serviceRate",
    label: "Service rate",
    basePath: "/fleet-ops/operations/service-rates",
    width: 720,
    large: false,
    testId: "service-rate-detail-drawer",
  },
  customer: {
    key: "customer",
    param: "customer",
    label: "Customer",
    basePath: "/fleet-ops/management/customers",
    width: 720,
    large: false,
    testId: "customer-detail-drawer",
  },
  integratedVendor: {
    key: "integratedVendor",
    param: "integratedVendor",
    label: "Integrated vendor",
    basePath: "/fleet-ops/management/integrated-vendors",
    width: 760,
    large: false,
    testId: "integrated-vendor-detail-drawer",
  },
  telematic: {
    key: "telematic",
    param: "telematic",
    label: "Telematic",
    basePath: "/fleet-ops/connectivity/telematics",
    width: 720,
    large: false,
    testId: "telematic-detail-drawer",
  },
  device: {
    key: "device",
    param: "device",
    label: "Device",
    basePath: "/fleet-ops/connectivity/devices",
    width: 760,
    large: false,
    testId: "device-detail-drawer",
  },
  sensor: {
    key: "sensor",
    param: "sensor",
    label: "Sensor",
    basePath: "/fleet-ops/connectivity/sensors",
    width: 720,
    large: false,
    testId: "sensor-detail-drawer",
  },
  deviceEvent: {
    key: "deviceEvent",
    param: "deviceEvent",
    label: "Device event",
    basePath: "/fleet-ops/connectivity/device-events",
    width: 640,
    large: false,
    testId: "device-event-detail-drawer",
  },
  maintenanceSchedule: {
    key: "maintenanceSchedule",
    param: "maintenanceSchedule",
    label: "Schedule",
    basePath: "/fleet-ops/maintenance/schedules",
    width: 820,
    large: false,
    testId: "maintenance-schedule-detail-drawer",
  },
  maintenance: {
    key: "maintenance",
    param: "maintenance",
    label: "Maintenance record",
    basePath: "/fleet-ops/maintenance/records",
    width: 820,
    large: false,
    testId: "maintenance-detail-drawer",
  },
  workOrder: {
    key: "workOrder",
    param: "workOrder",
    label: "Work order",
    basePath: "/fleet-ops/maintenance/work-orders",
    width: 760,
    large: false,
    testId: "work-order-detail-drawer",
  },
  equipment: {
    key: "equipment",
    param: "equipment",
    label: "Equipment",
    basePath: "/fleet-ops/maintenance/equipment",
    width: 720,
    large: false,
    testId: "equipment-detail-drawer",
  },
  part: {
    key: "part",
    param: "part",
    label: "Part",
    basePath: "/fleet-ops/maintenance/parts",
    width: 720,
    large: false,
    testId: "part-detail-drawer",
  },
  warranty: {
    key: "warranty",
    param: "warranty",
    label: "Warranty",
    basePath: "/fleet-ops/admin/warranties",
    width: 720,
    large: false,
    testId: "warranty-detail-drawer",
  },
  manifest: {
    key: "manifest",
    param: "manifest",
    label: "Manifest",
    basePath: "/fleet-ops/admin/manifests",
    width: 720,
    large: false,
    testId: "manifest-detail-drawer",
  },
  payload: {
    key: "payload",
    param: "payload",
    label: "Payload",
    basePath: "/fleet-ops/admin/payloads",
    width: 720,
    large: false,
    testId: "payload-detail-drawer",
  },
  entity: {
    key: "entity",
    param: "entity",
    label: "Entity",
    basePath: "/fleet-ops/admin/entities",
    width: 720,
    large: false,
    testId: "entity-detail-drawer",
  },
  proof: {
    key: "proof",
    param: "proof",
    label: "Proof",
    basePath: "/fleet-ops/admin/proofs",
    width: 720,
    large: false,
    testId: "proof-detail-drawer",
  },
  purchaseRate: {
    key: "purchaseRate",
    param: "purchaseRate",
    label: "Purchase rate",
    basePath: "/fleet-ops/admin/purchase-rates",
    width: 720,
    large: false,
    testId: "purchase-rate-detail-drawer",
  },
  trackingNumber: {
    key: "trackingNumber",
    param: "trackingNumber",
    label: "Tracking number",
    basePath: "/fleet-ops/admin/tracking-numbers",
    width: 720,
    large: false,
    testId: "tracking-number-detail-drawer",
  },
  trackingStatus: {
    key: "trackingStatus",
    param: "trackingStatus",
    label: "Tracking status",
    basePath: "/fleet-ops/admin/tracking-statuses",
    width: 720,
    large: false,
    testId: "tracking-status-detail-drawer",
  },
  serviceArea: {
    key: "serviceArea",
    param: "serviceArea",
    label: "Service area",
    basePath: "/fleet-ops/service-areas",
    width: 720,
    large: false,
    testId: "service-area-detail-drawer",
  },
  customField: {
    key: "customField",
    param: "customField",
    label: "Custom field",
    basePath: "/fleet-ops/custom-fields",
    width: 720,
    large: false,
    testId: "custom-field-detail-drawer",
  },
};

export function getEntityConfig(entityKey) {
  return normalizeDetailDrawerConfig(FLEETOPS_DETAIL_ENTITIES[entityKey] || null);
}

export function resolveEntityFromSearchParams(searchParams) {
  for (const config of Object.values(FLEETOPS_DETAIL_ENTITIES)) {
    const id = searchParams.get(config.param);
    if (id) {
      return {
        entity: config.key,
        entityId: id,
        config: normalizeDetailDrawerConfig(config),
      };
    }
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

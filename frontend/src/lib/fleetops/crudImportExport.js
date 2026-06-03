/** Maps CRUD entity keys to API resource path segments (for export/import/bulk-delete). */
export const CRUD_IMPORT_EXPORT_RESOURCES = {
  vendor: ["vendors"],
  integratedVendor: ["integrated-vendors", "integrated_vendors"],
  contact: ["contacts"],
  customer: ["customers"],
  fuelReport: ["fuel-reports", "fuel_reports"],
  issue: ["issues"],
  telematic: ["telematics"],
  device: ["devices"],
  sensor: ["sensors"],
  deviceEvent: ["device-events", "device_events"],
  maintenanceSchedule: ["maintenance-schedules", "maintenance_schedules"],
  maintenance: ["maintenances"],
  workOrder: ["work-orders", "work_orders"],
  equipment: ["equipment"],
  part: ["parts"],
  driver: ["drivers"],
  vehicle: ["vehicles"],
  place: ["places"],
  warranty: ["warranties"],
  payload: ["payloads"],
  entity: ["entities"],
  proof: ["proofs"],
  trackingNumber: ["tracking-numbers", "tracking_numbers"],
  trackingStatus: ["tracking-statuses", "tracking_statuses"],
};

export function entitySupportsImportExport(entityKey) {
  return Boolean(CRUD_IMPORT_EXPORT_RESOURCES[entityKey]);
}

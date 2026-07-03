import { CRUD_ENTITIES } from "@/lib/fleetops/crudEntities";

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
  maintenanceSchedule: ["maintenance-schedules"],
  maintenance: ["maintenances"],
  workOrder: ["work-orders"],
  equipment: ["equipment"],
  part: ["parts"],
  driver: ["drivers"],
  vehicle: ["vehicles"],
  fleet: ["fleets"],
  place: ["places"],
  warranty: ["warranties"],
  payload: ["payloads"],
  entity: ["entities"],
  proof: ["proofs"],
  trackingNumber: ["tracking-numbers", "tracking_numbers"],
  trackingStatus: ["tracking-statuses", "tracking_statuses"],
};

/** Resources with GET/POST /export on the FleetOps internal API. */
const SERVER_EXPORT_ENTITIES = new Set([
  "vendor",
  "contact",
  "customer",
  "fuelReport",
  "issue",
  "vehicle",
  "fleet",
  "place",
  "driver",
]);

/** Resources with POST /import on the FleetOps internal API. */
const SERVER_IMPORT_ENTITIES = new Set([
  "vendor",
  "contact",
  "customer",
  "fuelReport",
  "issue",
  "vehicle",
  "fleet",
  "place",
  "driver",
  "maintenanceSchedule",
  "maintenance",
  "workOrder",
  "equipment",
  "part",
]);

/** Maintenance catalog entities: export current list rows as CSV (no server /export route). */
const CLIENT_EXPORT_ENTITIES = new Set([
  "maintenanceSchedule",
  "maintenance",
  "workOrder",
  "equipment",
  "part",
  "warranty",
]);

/** Resources with DELETE /bulk-delete on the FleetOps internal API. */
const SERVER_BULK_DELETE_ENTITIES = new Set([
  "vendor",
  "integratedVendor",
  "contact",
  "customer",
  "fuelReport",
  "issue",
  "vehicle",
  "fleet",
  "place",
  "driver",
]);

export function entitySupportsServerExport(entityKey) {
  return SERVER_EXPORT_ENTITIES.has(entityKey);
}

export function entitySupportsClientExport(entityKey) {
  return CLIENT_EXPORT_ENTITIES.has(entityKey);
}

export function entitySupportsExport(entityKey) {
  return entitySupportsServerExport(entityKey) || entitySupportsClientExport(entityKey);
}

export function entitySupportsServerImport(entityKey) {
  return SERVER_IMPORT_ENTITIES.has(entityKey);
}

export function entitySupportsBulkDelete(entityKey) {
  return SERVER_BULK_DELETE_ENTITIES.has(entityKey);
}

export function entitySupportsImportExport(entityKey) {
  return (
    entitySupportsExport(entityKey) ||
    entitySupportsServerImport(entityKey) ||
    entitySupportsBulkDelete(entityKey)
  );
}

function escapeCsv(value) {
  const s = value == null || value === "—" ? "" : String(value);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

/** Build a CSV blob from loaded CRUD list rows (maintenance entities without server export). */
export function buildClientExportCsv(rows = [], entityKey, selectedIds = []) {
  const config = CRUD_ENTITIES[entityKey];
  let dataRows = rows;
  if (selectedIds?.length) {
    const selected = new Set(selectedIds.map(String));
    dataRows = rows.filter((row) => selected.has(String(row.id)));
  }

  const headers = ["Public ID", "UUID"];
  const sampleRaw = dataRows[0]?.raw || dataRows[0] || {};
  const displayFields = config?.displayFields?.(sampleRaw) || [{ label: "Name", value: sampleRaw.name || "" }];
  headers.push(...displayFields.map((field) => field.label));

  const lines = [headers.map(escapeCsv).join(",")];
  for (const row of dataRows) {
    const raw = row.raw || row;
    const fields = config?.displayFields?.(raw) || [{ label: "Name", value: row.name || raw.name || "" }];
    const values = [
      raw.public_id || raw.publicId || row.publicId || "",
      raw.uuid || raw.id || row.id || "",
      ...fields.map((field) => field.value),
    ];
    lines.push(values.map(escapeCsv).join(","));
  }

  return new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
}

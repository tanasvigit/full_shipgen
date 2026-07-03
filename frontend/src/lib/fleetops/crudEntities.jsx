/** Day 2 entity registry — shared list/detail/form configuration. */

import {
  assigneeLabel,
  formatReminderOffsets,
  subjectLabel,
} from "@/lib/fleetops/maintenancePayloads";
import { extractBorderGeometry, toLeafletPolygon } from "@/lib/fleetops/geofence";
import { deviceEventLabel } from "@/lib/fleetops/connectivityResourcePayloads";
import StatusBadge from "@/components/common/StatusBadge";
import DetailEntityLink from "@/components/fleetops/detail/DetailEntityLink";
import { formatMoney } from "@/lib/formatMoney";
import { serviceRatePerDistanceLabel } from "@/lib/fleetops/serviceRatePayloads";

/** Coerce API values (including nested relations) to a render-safe string. */
export function scalarLabel(value) {
  if (value == null || value === "") return null;
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  if (typeof value === "object") {
    return (
      scalarLabel(value.tracking_number) ||
      scalarLabel(value.name) ||
      scalarLabel(value.label) ||
      scalarLabel(value.code) ||
      scalarLabel(value.status) ||
      scalarLabel(value.public_id) ||
      scalarLabel(value.publicId) ||
      null
    );
  }
  return null;
}

/**
 * Purchase-rate relations come back from the internal API either as a bare
 * public-id string (customer/payload/order) or a nested object (service_quote).
 * Resolve a human label from whichever shape we get.
 */
function purchaseRateRef(value, preferKeys = []) {
  if (value == null || value === "") return null;
  if (typeof value === "string" || typeof value === "number") return String(value);
  if (typeof value === "object") {
    for (const key of [...preferKeys, "public_id", "publicId", "uuid"]) {
      if (value[key]) return String(value[key]);
    }
  }
  return null;
}

/** Friendly label for a proof subject public id (order_, entity_, waypoint_). */
function proofSubjectLabel(subjectId, subjectType) {
  const id = purchaseRateRef(subjectId) || purchaseRateRef(subjectType);
  if (!id) return null;
  if (String(id).startsWith("order_")) return "Order";
  if (String(id).startsWith("entity_")) return "Entity";
  if (String(id).startsWith("waypoint_")) return "Waypoint";
  const type = String(subjectType || "");
  if (type.includes("Order")) return "Order";
  if (type.includes("Entity")) return "Entity";
  if (type.includes("Waypoint")) return "Waypoint";
  return id;
}

/** Internal proof API returns order_id / subject_id / url as flat strings. */
function proofRef(value) {
  return purchaseRateRef(value);
}

function proofFileUrl(raw) {
  return raw?.url || raw?.file_url || raw?.file?.url || raw?.file?.original_url || "";
}

export function mapCrudRow(raw = {}, fallbackPrefix = "entity") {
  const id = raw.uuid || raw.id || raw.public_id;
  return {
    id: String(id || ""),
    publicId: raw.public_id || raw.publicId || raw.internal_id || id || "—",
    name:
      scalarLabel(raw.name) ||
      scalarLabel(raw.remarks) ||
      scalarLabel(raw.title) ||
      scalarLabel(raw.subject) ||
      scalarLabel(raw.summary) ||
      scalarLabel(raw.label) ||
      scalarLabel(raw.tracking_number) ||
      scalarLabel(raw.provider) ||
      scalarLabel(raw.policy_number) ||
      scalarLabel(raw.service_name) ||
      scalarLabel(raw.code) ||
      scalarLabel(raw.tracking_number) ||
      scalarLabel(raw.public_id) ||
      "Untitled",
    status: scalarLabel(raw.status) || scalarLabel(raw.state) || "active",
    email: raw.email || "",
    phone: raw.phone || raw.phone_number || "",
    description: raw.description || raw.notes || "",
    type: scalarLabel(raw.type) || scalarLabel(raw.category) || "",
    raw,
  };
}

export const CRUD_ENTITIES = {
  vendor: {
    key: "vendor",
    pluralLabel: "Vendors",
    singularLabel: "Vendor",
    section: "Management",
    listPath: "/fleet-ops/management/vendors",
    permissionResource: "vendor",
    searchKeys: ["name", "publicId", "email", "phone"],
    fields: [
      { name: "name", label: "Name", required: true },
      {
        name: "type",
        label: "Role",
        type: "select",
        options: [
          { value: "facilitator", label: "Facilitator (carrier / partner)" },
          { value: "customer", label: "Customer (order billing only)" },
        ],
        defaultValue: "facilitator",
      },
      { name: "email", label: "Email", type: "email" },
      { name: "phone", label: "Phone" },
      { name: "status", label: "Status" },
      { name: "country", label: "Country" },
      { name: "description", label: "Description", type: "textarea" },
    ],
  },
  integratedVendor: {
    key: "integratedVendor",
    pluralLabel: "Integrated vendors",
    singularLabel: "Integrated vendor",
    section: "Management",
    listPath: "/fleet-ops/management/integrated-vendors",
    permissionResource: "vendor",
    searchKeys: ["name", "publicId"],
    fields: [
      { name: "name", label: "Name", required: true },
      { name: "provider", label: "Provider", required: true },
      { name: "host", label: "Host / endpoint" },
      { name: "webhook_url", label: "Webhook URL" },
      { name: "status", label: "Status" },
      { name: "credentials", label: "Credentials (JSON)", type: "textarea" },
    ],
  },
  contact: {
    key: "contact",
    pluralLabel: "Contacts",
    singularLabel: "Contact",
    section: "Management",
    listPath: "/fleet-ops/management/contacts",
    permissionResource: "contact",
    searchKeys: ["name", "publicId", "email", "phone"],
    fields: [
      { name: "name", label: "Name", required: true },
      {
        name: "type",
        label: "Role",
        type: "select",
        options: [
          { value: "contact", label: "Contact" },
          { value: "customer", label: "Customer (can log in)" },
          { value: "facilitator", label: "Facilitator" },
        ],
        defaultValue: "contact",
      },
      { name: "email", label: "Email", type: "email" },
      { name: "phone", label: "Phone" },
      { name: "title", label: "Title" },
      { name: "status", label: "Status" },
    ],
  },
  customer: {
    key: "customer",
    pluralLabel: "Customers",
    singularLabel: "Customer",
    section: "Management",
    listPath: "/fleet-ops/management/customers",
    permissionResource: "customer",
    searchKeys: ["name", "publicId", "email"],
    fields: [
      { name: "name", label: "Name", required: true },
      { name: "email", label: "Email", type: "email", required: true },
      { name: "phone", label: "Phone" },
      { name: "title", label: "Title" },
      { name: "internal_id", label: "Internal ID" },
    ],
  },
  fuelReport: {
    key: "fuelReport",
    pluralLabel: "Fuel reports",
    singularLabel: "Fuel report",
    section: "Management",
    listPath: "/fleet-ops/management/fuel-reports",
    permissionResource: "fuel-report",
    searchKeys: ["name", "publicId"],
    fields: [
      { name: "name", label: "Reference", required: true },
      { name: "vehicle_id", label: "Vehicle ID" },
      { name: "driver_id", label: "Driver ID" },
      { name: "volume", label: "Volume (L)" },
      { name: "cost", label: "Cost" },
      { name: "odometer", label: "Odometer (km)" },
      { name: "reported_at", label: "Reported at" },
      { name: "status", label: "Status" },
    ],
  },
  issue: {
    key: "issue",
    pluralLabel: "Issues",
    singularLabel: "Issue",
    section: "Management",
    listPath: "/fleet-ops/management/issues",
    permissionResource: "issue",
    searchKeys: ["name", "publicId", "status"],
    fields: [
      { name: "name", label: "Title", required: true },
      { name: "status", label: "Status" },
      { name: "priority", label: "Priority" },
      { name: "type", label: "Type" },
      { name: "vehicle_id", label: "Vehicle ID" },
      { name: "driver_id", label: "Driver ID" },
      { name: "order_id", label: "Order ID" },
      { name: "description", label: "Description", type: "textarea" },
    ],
    statusField: true,
  },
  telematic: {
    key: "telematic",
    pluralLabel: "Telematics",
    singularLabel: "Telematic",
    section: "Connectivity",
    listPath: "/fleet-ops/connectivity/telematics",
    permissionResource: "telematic",
    searchKeys: ["name", "publicId", "provider"],
    fields: [
      { name: "name", label: "Name", required: true },
      { name: "provider", label: "Provider" },
      { name: "model", label: "Model" },
      { name: "serial_number", label: "Serial number" },
      { name: "imei", label: "IMEI" },
      { name: "status", label: "Status" },
    ],
    listColumns: [
      { key: "name", header: "Telematic", sortable: true, render: (r) => <span className="text-[#0066FF] font-medium">{r.name}</span> },
      { key: "provider", header: "Provider", render: (r) => r.raw?.provider || "—" },
      { key: "model", header: "Model", render: (r) => r.raw?.model || "—" },
      { key: "status", header: "Status", render: (r) => <StatusBadge status={r.status} label={String(r.status || "—")} /> },
      { key: "publicId", header: "Public ID", render: (r) => <span className="font-mono text-xs">{r.publicId}</span> },
    ],
    displayFields: (raw) => [
      { label: "Name", value: raw?.name || "—" },
      { label: "Provider", value: raw?.provider || "—" },
      { label: "Model", value: raw?.model || "—" },
      { label: "Serial", value: raw?.serial_number || "—" },
      { label: "IMEI", value: raw?.imei || "—" },
      { label: "Status", value: raw?.status || "—" },
    ],
  },
  device: {
    key: "device",
    pluralLabel: "Devices",
    singularLabel: "Device",
    section: "Connectivity",
    listPath: "/fleet-ops/connectivity/devices",
    permissionResource: "device",
    searchKeys: ["name", "publicId", "imei"],
    fields: [
      { name: "name", label: "Name", required: true },
      { name: "imei", label: "IMEI" },
      { name: "serial_number", label: "Serial number" },
      { name: "provider", label: "Provider" },
      { name: "type", label: "Type" },
      { name: "telematic", label: "Telematic (UUID or public ID)" },
      { name: "status", label: "Status" },
    ],
    listColumns: [
      { key: "name", header: "Device", sortable: true, render: (r) => <span className="text-[#0066FF] font-medium">{r.name}</span> },
      { key: "imei", header: "IMEI", render: (r) => <span className="font-mono text-xs">{r.raw?.imei || "—"}</span> },
      { key: "serial", header: "Serial", render: (r) => r.raw?.serial_number || "—" },
      { key: "provider", header: "Provider", render: (r) => r.raw?.provider || "—" },
      { key: "status", header: "Status", render: (r) => <StatusBadge status={r.status} label={String(r.status || "—")} /> },
    ],
    displayFields: (raw) => [
      { label: "Name", value: raw?.name || "—" },
      { label: "IMEI", value: raw?.imei || "—" },
      { label: "Serial", value: raw?.serial_number || "—" },
      { label: "Provider", value: raw?.provider || "—" },
      { label: "Type", value: raw?.type || "—" },
      { label: "Model", value: raw?.model || "—" },
      { label: "Status", value: raw?.status || "—" },
      { label: "Telematic", value: raw?.telematic?.name || raw?.telematic_uuid || "—" },
      { label: "Attached to", value: raw?.attached_to_name || raw?.attachable_name || raw?.attachable_type || "—" },
    ],
  },
  sensor: {
    key: "sensor",
    pluralLabel: "Sensors",
    singularLabel: "Sensor",
    section: "Connectivity",
    listPath: "/fleet-ops/connectivity/sensors",
    permissionResource: "sensor",
    searchKeys: ["name", "publicId", "type"],
    fields: [
      { name: "name", label: "Name", required: true },
      { name: "type", label: "Type" },
      { name: "device", label: "Device public ID" },
      { name: "unit", label: "Unit" },
      { name: "min_threshold", label: "Min threshold" },
      { name: "max_threshold", label: "Max threshold" },
      { name: "status", label: "Status" },
    ],
    listColumns: [
      { key: "name", header: "Sensor", sortable: true, render: (r) => <span className="text-[#0066FF] font-medium">{r.name}</span> },
      { key: "type", header: "Type", render: (r) => r.raw?.type || r.type || "—" },
      { key: "unit", header: "Unit", render: (r) => r.raw?.unit || "—" },
      { key: "device", header: "Device", render: (r) => r.raw?.device?.name || r.raw?.device_uuid || "—" },
      { key: "status", header: "Status", render: (r) => <StatusBadge status={r.status} label={String(r.status || "—")} /> },
    ],
    displayFields: (raw) => [
      { label: "Name", value: raw?.name || "—" },
      { label: "Type", value: raw?.type || "—" },
      { label: "Unit", value: raw?.unit || "—" },
      { label: "Min threshold", value: raw?.min_threshold ?? "—" },
      { label: "Max threshold", value: raw?.max_threshold ?? "—" },
      { label: "Device", value: raw?.device?.name || raw?.device_uuid || "—" },
      { label: "Status", value: raw?.status || "—" },
    ],
  },
  deviceEvent: {
    key: "deviceEvent",
    pluralLabel: "Device events",
    singularLabel: "Device event",
    section: "Connectivity",
    listPath: "/fleet-ops/connectivity/device-events",
    permissionResource: "device-event",
    searchKeys: ["name", "publicId", "type"],
    readOnly: true,
    fields: [],
    listColumns: [
      { key: "type", header: "Event", render: (r) => <span className="font-medium">{deviceEventLabel(r.raw)}</span> },
      { key: "device", header: "Device", render: (r) => r.raw?.device?.name || r.raw?.device_uuid || "—" },
      { key: "when", header: "When", render: (r) => r.raw?.created_at || r.raw?.occurred_at || "—" },
      { key: "publicId", header: "Public ID", render: (r) => <span className="font-mono text-xs">{r.publicId}</span> },
    ],
    displayFields: (raw) => [
      { label: "Event type", value: deviceEventLabel(raw) },
      { label: "Device", value: raw?.device?.name || raw?.device_uuid || "—" },
      { label: "Occurred", value: raw?.occurred_at || raw?.created_at || "—" },
      { label: "Payload", value: typeof raw?.data === "object" ? JSON.stringify(raw.data) : raw?.data || "—" },
    ],
  },
  maintenanceSchedule: {
    key: "maintenanceSchedule",
    pluralLabel: "Maintenance schedules",
    singularLabel: "Schedule",
    section: "Maintenance",
    listPath: "/fleet-ops/maintenance/schedules",
    permissionResource: "maintenance",
    searchKeys: ["name", "publicId"],
    fields: [
      { name: "name", label: "Name", required: true },
      { name: "status", label: "Status" },
    ],
    listColumns: [
      {
        key: "name",
        header: "Schedule",
        sortable: true,
        render: (r) => <span className="text-[#0066FF] font-medium">{r.name}</span>,
      },
      {
        key: "asset",
        header: "Asset",
        render: (r) => subjectLabel(r.raw),
      },
      {
        key: "status",
        header: "Status",
        render: (r) => <StatusBadge status={r.status} label={String(r.status || "—")} />,
      },
      {
        key: "nextDue",
        header: "Next due",
        render: (r) => {
          const d = r.raw?.next_due_date;
          const km = r.raw?.next_due_odometer;
          if (d) return String(d).slice(0, 10);
          if (km) return `${km} km`;
          return "—";
        },
      },
    ],
    displayFields: (raw) => [
      { label: "Name", value: raw?.name || "—" },
      { label: "Status", value: raw?.status || "—" },
      { label: "Asset", value: subjectLabel(raw) },
      { label: "Assignee", value: assigneeLabel(raw) },
      { label: "Priority", value: raw?.default_priority || "—" },
      { label: "Time interval", value: raw?.interval_value ? `${raw.interval_value} ${raw.interval_unit || ""}` : "—" },
      { label: "Distance interval", value: raw?.interval_distance ? `${raw.interval_distance} km` : "—" },
      { label: "Engine hours interval", value: raw?.interval_engine_hours || "—" },
      { label: "Next due date", value: raw?.next_due_date ? String(raw.next_due_date).slice(0, 10) : "—" },
      { label: "Next due odometer", value: raw?.next_due_odometer ?? "—" },
      { label: "Reminders (days before)", value: formatReminderOffsets(raw?.reminder_offsets) || "—" },
      { label: "Instructions", value: raw?.instructions || "—" },
    ],
  },
  maintenance: {
    key: "maintenance",
    pluralLabel: "Maintenance records",
    singularLabel: "Maintenance record",
    section: "Maintenance",
    listPath: "/fleet-ops/maintenance/records",
    permissionResource: "maintenance",
    searchKeys: ["name", "publicId"],
    fields: [{ name: "summary", label: "Summary", required: true }],
    listColumns: [
      {
        key: "name",
        header: "Summary",
        sortable: true,
        render: (r) => <span className="text-[#0066FF] font-medium">{r.name}</span>,
      },
      { key: "asset", header: "Asset", render: (r) => subjectLabel(r.raw) },
      {
        key: "status",
        header: "Status",
        render: (r) => <StatusBadge status={r.status} label={String(r.status || "—")} />,
      },
      {
        key: "completed",
        header: "Completed",
        render: (r) => (r.raw?.completed_at ? String(r.raw.completed_at).slice(0, 10) : "—"),
      },
    ],
    displayFields: (raw) => [
      { label: "Summary", value: raw?.summary || raw?.name || "—" },
      { label: "Status", value: raw?.status || "—" },
      { label: "Asset", value: subjectLabel(raw) },
      { label: "Performed by", value: assigneeLabel(raw) },
      { label: "Scheduled", value: raw?.scheduled_at ? String(raw.scheduled_at).slice(0, 16) : "—" },
      { label: "Completed", value: raw?.completed_at ? String(raw.completed_at).slice(0, 16) : "—" },
      { label: "Odometer", value: raw?.odometer ?? "—" },
      { label: "Engine hours", value: raw?.engine_hours ?? "—" },
      { label: "Labor cost", value: raw?.labor_cost?.amount ?? raw?.labor_cost ?? "—" },
      { label: "Parts cost", value: raw?.parts_cost?.amount ?? raw?.parts_cost ?? "—" },
      { label: "Total cost", value: raw?.total_cost?.amount ?? raw?.total_cost ?? "—" },
      { label: "Notes", value: raw?.notes || "—" },
    ],
  },
  workOrder: {
    key: "workOrder",
    pluralLabel: "Work orders",
    singularLabel: "Work order",
    section: "Maintenance",
    listPath: "/fleet-ops/maintenance/work-orders",
    permissionResource: "work-order",
    searchKeys: ["name", "publicId", "status"],
    fields: [{ name: "subject", label: "Title", required: true }],
    statusField: true,
    listColumns: [
      {
        key: "name",
        header: "Work order",
        sortable: true,
        render: (r) => <span className="text-[#0066FF] font-medium">{r.name}</span>,
      },
      { key: "code", header: "Code", render: (r) => <span className="font-mono text-xs">{r.raw?.code || "—"}</span> },
      { key: "asset", header: "Asset", render: (r) => subjectLabel(r.raw) },
      {
        key: "status",
        header: "Status",
        render: (r) => <StatusBadge status={r.status} label={String(r.status || "—")} />,
      },
      { key: "due", header: "Due", render: (r) => (r.raw?.due_at ? String(r.raw.due_at).slice(0, 10) : "—") },
    ],
    displayFields: (raw) => [
      { label: "Title", value: raw?.subject || raw?.name || "—" },
      { label: "Code", value: raw?.code || "—" },
      { label: "Status", value: raw?.status || "—" },
      { label: "Priority", value: raw?.priority || "—" },
      { label: "Asset", value: subjectLabel(raw) },
      { label: "Assignee", value: assigneeLabel(raw) },
      { label: "Due at", value: raw?.due_at ? String(raw.due_at).slice(0, 16) : "—" },
      { label: "Estimated cost", value: raw?.estimated_cost?.amount ?? raw?.estimated_cost ?? "—" },
      { label: "Approved budget", value: raw?.approved_budget?.amount ?? raw?.approved_budget ?? "—" },
      { label: "Actual cost", value: raw?.actual_cost?.amount ?? raw?.actual_cost ?? "—" },
      { label: "Instructions", value: raw?.instructions || "—" },
    ],
  },
  equipment: {
    key: "equipment",
    pluralLabel: "Equipment",
    singularLabel: "Equipment",
    section: "Maintenance",
    listPath: "/fleet-ops/maintenance/equipment",
    permissionResource: "equipment",
    searchKeys: ["name", "publicId"],
    fields: [{ name: "name", label: "Name", required: true }],
    listColumns: [
      {
        key: "name",
        header: "Equipment",
        sortable: true,
        render: (r) => <span className="text-[#0066FF] font-medium">{r.name}</span>,
      },
      { key: "serial", header: "Serial", render: (r) => r.raw?.serial_number || r.raw?.serial || "—" },
      { key: "asset", header: "Attached to", render: (r) => r.raw?.equipped_to_name || subjectLabel(r.raw) },
      {
        key: "status",
        header: "Status",
        render: (r) => <StatusBadge status={r.status} label={String(r.status || "—")} />,
      },
    ],
    displayFields: (raw) => [
      { label: "Name", value: raw?.name || "—" },
      { label: "Code", value: raw?.code || "—" },
      { label: "Type", value: raw?.type || "—" },
      { label: "Serial", value: raw?.serial_number || "—" },
      { label: "Manufacturer", value: raw?.manufacturer || "—" },
      { label: "Model", value: raw?.model || "—" },
      { label: "Attached to", value: raw?.equipped_to_name || "—" },
      { label: "Warranty", value: raw?.warranty_name || "—" },
      { label: "Purchased", value: raw?.purchased_at ? String(raw.purchased_at).slice(0, 10) : "—" },
      { label: "Purchase price", value: raw?.purchase_price?.amount ?? raw?.purchase_price ?? "—" },
      { label: "Status", value: raw?.status || "—" },
    ],
  },
  part: {
    key: "part",
    pluralLabel: "Parts",
    singularLabel: "Part",
    section: "Maintenance",
    listPath: "/fleet-ops/maintenance/parts",
    permissionResource: "part",
    searchKeys: ["name", "publicId", "sku"],
    fields: [{ name: "name", label: "Name", required: true }],
    listColumns: [
      {
        key: "name",
        header: "Part",
        sortable: true,
        render: (r) => <span className="text-[#0066FF] font-medium">{r.name}</span>,
      },
      { key: "sku", header: "SKU", render: (r) => r.raw?.sku || "—" },
      { key: "qty", header: "Qty", render: (r) => r.raw?.quantity_on_hand ?? r.raw?.quantity ?? "—" },
      { key: "vendor", header: "Vendor", render: (r) => r.raw?.vendor_name || "—" },
      {
        key: "status",
        header: "Status",
        render: (r) => {
          const deleted = r.raw?.deleted_at;
          const status = deleted ? "deleted" : r.status || "active";
          const label = deleted ? "Deleted" : String(r.status || "active");
          return <StatusBadge status={status} label={label} />;
        },
      },
    ],
    displayFields: (raw) => [
      { label: "Name", value: raw?.name || "—" },
      { label: "SKU", value: raw?.sku || "—" },
      { label: "Quantity on hand", value: raw?.quantity_on_hand ?? "—" },
      { label: "Unit cost", value: raw?.unit_cost?.amount ?? raw?.unit_cost ?? "—" },
      { label: "MSRP", value: raw?.msrp?.amount ?? raw?.msrp ?? "—" },
      { label: "Vendor", value: raw?.vendor_name || "—" },
      { label: "Manufacturer", value: raw?.manufacturer || "—" },
      { label: "Barcode", value: raw?.barcode || "—" },
      { label: "Description", value: raw?.description || "—" },
      { label: "Status", value: raw?.status || "—" },
    ],
  },
  serviceArea: {
    key: "serviceArea",
    pluralLabel: "Service areas",
    singularLabel: "Service area",
    section: "Platform",
    listPath: "/fleet-ops/service-areas",
    permissionResource: "service-area",
    searchKeys: ["name", "publicId", "status"],
    fields: [
      { name: "name", label: "Name", required: true },
      { name: "status", label: "Status" },
      { name: "description", label: "Description", type: "textarea" },
    ],
    displayFields: (raw) => [
      { label: "Name", value: raw?.name || "—" },
      { label: "Status", value: raw?.status || "—" },
      { label: "Type", value: raw?.type || "—" },
      {
        label: "Boundary",
        value: toLeafletPolygon(extractBorderGeometry(raw)).length >= 3 ? "Defined on map" : "Not set",
      },
      { label: "Zones", value: Array.isArray(raw?.zones) ? String(raw.zones.length) : "—" },
      { label: "Description", value: raw?.description || "—" },
    ],
    listColumns: [
      {
        key: "name",
        header: "Service area",
        sortable: true,
        render: (r) => <span className="text-[#0066FF] font-medium">{r.name}</span>,
      },
      {
        key: "boundary",
        header: "Boundary",
        render: (r) => {
          const defined = toLeafletPolygon(extractBorderGeometry(r.raw)).length >= 3;
          return defined ? "Defined" : "Not set";
        },
      },
      {
        key: "zones",
        header: "Zones",
        render: (r) => (Array.isArray(r.raw?.zones) ? r.raw.zones.length : "—"),
      },
      { key: "status", header: "Status", render: (r) => <StatusBadge status={r.status} label={String(r.status || "—")} /> },
      { key: "publicId", header: "Public ID", render: (r) => <span className="font-mono text-xs">{r.publicId}</span> },
    ],
  },
  serviceAreaZone: {
    key: "serviceAreaZone",
    pluralLabel: "Service area zones",
    singularLabel: "Zone",
    section: "Geo",
    listPath: "/fleet-ops/service-areas",
    permissionResource: "service-area",
    searchKeys: ["name", "publicId", "status"],
    fields: [
      { name: "name", label: "Name", required: true },
      { name: "status", label: "Status" },
      { name: "description", label: "Description", type: "textarea" },
    ],
  },
  customField: {
    key: "customField",
    pluralLabel: "Custom fields",
    singularLabel: "Custom field",
    section: "Platform",
    listPath: "/fleet-ops/custom-fields",
    permissionResource: "custom-field",
    searchKeys: ["name", "label", "publicId", "for", "type"],
    fields: [
      { name: "label", label: "Label", required: true },
      { name: "name", label: "Field key", placeholder: "auto-generated from label if empty" },
      {
        name: "for",
        label: "Entity type",
        required: true,
        type: "select",
        options: [
          { value: "order", label: "Order" },
          { value: "driver", label: "Driver" },
          { value: "vehicle", label: "Vehicle" },
          { value: "contact", label: "Contact" },
          { value: "vendor", label: "Vendor" },
          { value: "place", label: "Place" },
          { value: "entity", label: "Entity (payload item)" },
          { value: "fleet", label: "Fleet" },
          { value: "issue", label: "Issue" },
          { value: "fuel-report", label: "Fuel report" },
        ],
      },
      {
        name: "type",
        label: "Field type",
        required: true,
        type: "select",
        options: [
          { value: "text", label: "Text" },
          { value: "number", label: "Number" },
          { value: "boolean", label: "Boolean" },
          { value: "date", label: "Date" },
          { value: "select", label: "Select" },
        ],
      },
      { name: "description", label: "Description", type: "textarea" },
    ],
    displayFields: (raw) => [
      { label: "Label", value: raw?.label || raw?.name || "—" },
      { label: "Field key", value: raw?.name || "—" },
      { label: "Entity type", value: raw?.for || raw?.entity_type || "—" },
      { label: "Field type", value: raw?.type || raw?.field_type || "—" },
      { label: "Required", value: raw?.required ? "Yes" : "No" },
      { label: "Description", value: raw?.description || "—" },
    ],
  },
  warranty: {
    key: "warranty",
    pluralLabel: "Warranties",
    singularLabel: "Warranty",
    section: "Resources",
    listPath: "/fleet-ops/admin/warranties",
    permissionResource: "warranty",
    searchKeys: ["name", "publicId", "provider", "policy_number"],
    fields: [{ name: "provider", label: "Provider", required: true }],
    listColumns: [
      { key: "provider", header: "Provider", sortable: true, render: (r) => <span className="text-[#0066FF] font-medium">{r.raw?.provider || r.name}</span> },
      { key: "policy", header: "Policy", render: (r) => r.raw?.policy_number || "—" },
      { key: "asset", header: "Asset", render: (r) => r.raw?.subject_name || "—" },
      { key: "status", header: "Status", render: (r) => <StatusBadge status={r.raw?.status || r.status} label={String(r.raw?.status || r.status || "—")} /> },
      { key: "end", header: "Ends", render: (r) => (r.raw?.end_date ? String(r.raw.end_date).slice(0, 10) : "—") },
    ],
    displayFields: (raw) => [
      { label: "Provider", value: raw?.provider || "—" },
      { label: "Policy number", value: raw?.policy_number || "—" },
      { label: "Asset", value: raw?.subject_name || subjectLabel(raw) },
      { label: "Vendor", value: raw?.vendor_name || "—" },
      { label: "Start date", value: raw?.start_date ? String(raw.start_date).slice(0, 10) : "—" },
      { label: "End date", value: raw?.end_date ? String(raw.end_date).slice(0, 10) : "—" },
      { label: "Status", value: raw?.status || "—" },
      { label: "Coverage", value: typeof raw?.coverage === "object" ? JSON.stringify(raw.coverage) : raw?.coverage || "—" },
      { label: "Terms", value: raw?.terms || "—" },
    ],
  },
  payload: {
    key: "payload",
    pluralLabel: "Payloads",
    singularLabel: "Payload",
    section: "Resources",
    listPath: "/fleet-ops/admin/payloads",
    permissionResource: "payload",
    searchKeys: ["name", "publicId", "type"],
    fields: [],
    listColumns: [
      { key: "type", header: "Type", sortable: true, render: (r) => <span className="text-[#0066FF] font-medium">{r.raw?.type || r.type || "—"}</span> },
      { key: "pickup", header: "Pickup", render: (r) => r.raw?.pickup?.name || r.raw?.pickup_name || r.raw?.pickup?.public_id || "—" },
      { key: "dropoff", header: "Dropoff", render: (r) => r.raw?.dropoff?.name || r.raw?.dropoff_name || r.raw?.dropoff?.public_id || "—" },
      { key: "cod", header: "COD", render: (r) => (r.raw?.cod_amount ? `${r.raw.cod_amount} ${r.raw.cod_currency || ""}`.trim() : "—") },
      { key: "publicId", header: "Public ID", render: (r) => <span className="font-mono text-xs">{r.publicId}</span> },
    ],
    displayFields: (raw) => [
      { label: "Type", value: raw?.type || "—" },
      { label: "Pickup", value: raw?.pickup?.name || raw?.pickup?.public_id || "—" },
      { label: "Dropoff", value: raw?.dropoff?.name || raw?.dropoff?.public_id || "—" },
      { label: "COD", value: raw?.cod_amount ? `${raw.cod_amount} ${raw.cod_currency || ""}`.trim() : "—" },
      { label: "Payment method", value: raw?.cod_payment_method || "—" },
    ],
  },
  entity: {
    key: "entity",
    pluralLabel: "Entities",
    singularLabel: "Entity",
    section: "Resources",
    listPath: "/fleet-ops/admin/entities",
    permissionResource: "entity",
    searchKeys: ["name", "publicId", "type", "sku"],
    fields: [],
    listColumns: [
      { key: "name", header: "Entity", sortable: true, render: (r) => <span className="text-[#0066FF] font-medium">{r.name}</span> },
      { key: "type", header: "Type", render: (r) => r.raw?.type || "—" },
      { key: "sku", header: "SKU", render: (r) => r.raw?.sku || "—" },
      { key: "weight", header: "Weight", render: (r) => (r.raw?.weight ? `${r.raw.weight} ${r.raw.weight_unit || ""}`.trim() : "—") },
      { key: "publicId", header: "Public ID", render: (r) => <span className="font-mono text-xs">{r.publicId}</span> },
    ],
    displayFields: (raw) => [
      { label: "Name", value: raw?.name || "—" },
      { label: "Type", value: raw?.type || "—" },
      { label: "SKU", value: raw?.sku || "—" },
      { label: "Weight", value: raw?.weight ? `${raw.weight} ${raw.weight_unit || ""}`.trim() : "—" },
      { label: "Declared value", value: raw?.declared_value ?? "—" },
      { label: "Payload", value: raw?.payload?.public_id || raw?.payload_uuid || "—" },
      { label: "Description", value: raw?.description || "—" },
    ],
  },
  proof: {
    key: "proof",
    pluralLabel: "Proofs",
    singularLabel: "Proof",
    section: "Resources",
    listPath: "/fleet-ops/admin/proofs",
    permissionResource: "proof",
    searchKeys: ["name", "publicId", "raw.remarks", "raw.order_id", "raw.subject_id"],
    readOnly: true,
    fields: [],
    listColumns: [
      { key: "remarks", header: "Proof", render: (r) => r.raw?.remarks || r.name || "—" },
      {
        key: "order",
        header: "Order",
        render: (r) => proofRef(r.raw?.order) || r.raw?.order_id || r.raw?.order_uuid || "—",
      },
      {
        key: "subject",
        header: "Subject",
        render: (r) =>
          proofRef(r.raw?.subject) ||
          r.raw?.subject_id ||
          proofSubjectLabel(r.raw?.subject_id, r.raw?.subject_type) ||
          "—",
      },
      {
        key: "file",
        header: "File",
        render: (r) => (proofFileUrl(r.raw) ? "Attached" : "—"),
      },
      { key: "publicId", header: "Public ID", render: (r) => <span className="font-mono text-xs">{r.publicId}</span> },
    ],
    displayFields: (raw) => {
      const orderId = proofRef(raw?.order) || raw?.order_id || raw?.order_uuid || "";
      const subjectId = proofRef(raw?.subject) || raw?.subject_id || "";
      const fileUrl = proofFileUrl(raw);
      return [
        { label: "Remarks", value: raw?.remarks || "—" },
        {
          label: "Order",
          value: orderId ? (
            <DetailEntityLink entityKey="order" entityId={orderId}>
              <span className="font-mono text-xs">{orderId}</span>
            </DetailEntityLink>
          ) : (
            "—"
          ),
        },
        {
          label: "Subject",
          value: subjectId ? (
            <span className="font-mono text-xs">
              {proofSubjectLabel(subjectId, raw?.subject_type)} · {subjectId}
            </span>
          ) : (
            proofSubjectLabel(null, raw?.subject_type) || "—"
          ),
        },
        { label: "File", value: fileUrl ? "Attached — see below" : "—" },
        { label: "Created", value: raw?.created_at ? String(raw.created_at).slice(0, 16) : "—" },
      ];
    },
  },
  purchaseRate: {
    key: "purchaseRate",
    pluralLabel: "Purchase rates",
    singularLabel: "Purchase rate",
    section: "Resources",
    listPath: "/fleet-ops/admin/purchase-rates",
    permissionResource: "purchase-rate",
    searchKeys: ["name", "publicId", "status"],
    fields: [],
    listColumns: [
      { key: "quote", header: "Service quote", render: (r) => purchaseRateRef(r.raw?.service_quote) || r.raw?.service_quote_id || "—" },
      { key: "payload", header: "Payload", render: (r) => purchaseRateRef(r.raw?.payload) || r.raw?.payload_id || "—" },
      { key: "customer", header: "Customer", render: (r) => purchaseRateRef(r.raw?.customer, ["name"]) || r.raw?.customer_id || "—" },
      { key: "status", header: "Status", render: (r) => <StatusBadge status={r.status} label={String(r.status || "—")} /> },
      { key: "publicId", header: "Public ID", render: (r) => <span className="font-mono text-xs">{r.publicId}</span> },
    ],
    displayFields: (raw) => [
      {
        label: "Service quote",
        value:
          purchaseRateRef(raw?.service_quote) ||
          raw?.service_quote_id ||
          (raw?.service_quote?.amount != null
            ? `${raw.service_quote.amount} ${raw.service_quote.currency || ""}`.trim()
            : null) ||
          "—",
      },
      {
        label: "Amount",
        value:
          raw?.amount != null || raw?.service_quote?.amount != null
            ? `${raw?.amount ?? raw?.service_quote?.amount} ${raw?.currency || raw?.service_quote?.currency || ""}`.trim()
            : "—",
      },
      {
        label: "Payload",
        value: purchaseRateRef(raw?.payload) || raw?.payload_id || raw?.payload_uuid || "—",
      },
      {
        label: "Customer",
        value: purchaseRateRef(raw?.customer, ["name"]) || raw?.customer_id || "—",
      },
      { label: "Order", value: purchaseRateRef(raw?.order) || raw?.order_id || "— (link from order)" },
      { label: "Status", value: scalarLabel(raw?.status) || "active" },
    ],
  },
  trackingNumber: {
    key: "trackingNumber",
    pluralLabel: "Tracking numbers",
    singularLabel: "Tracking number",
    section: "Resources",
    listPath: "/fleet-ops/admin/tracking-numbers",
    permissionResource: "tracking-number",
    searchKeys: ["name", "publicId", "tracking_number"],
    fields: [],
    listColumns: [
      { key: "number", header: "Tracking #", sortable: true, render: (r) => <span className="font-mono text-xs text-[#0066FF]">{r.raw?.tracking_number || r.publicId}</span> },
      { key: "region", header: "Region", render: (r) => r.raw?.region || "—" },
      { key: "owner", header: "Owner", render: (r) => r.raw?.owner?.public_id || r.raw?.subject || r.raw?.owner_type || "—" },
      { key: "status", header: "Status", render: (r) => <StatusBadge status={r.status} label={String(r.status || "—")} /> },
    ],
    displayFields: (raw) => [
      { label: "Tracking number", value: raw?.tracking_number || raw?.public_id || "—" },
      { label: "Region", value: raw?.region || "—" },
      { label: "Type", value: raw?.type || "—" },
      { label: "Owner", value: raw?.owner?.public_id || raw?.subject || "—" },
      { label: "Status", value: raw?.status || "—" },
    ],
  },
  trackingStatus: {
    key: "trackingStatus",
    pluralLabel: "Tracking statuses",
    singularLabel: "Tracking status",
    section: "Resources",
    listPath: "/fleet-ops/admin/tracking-statuses",
    permissionResource: "tracking-status",
    searchKeys: ["name", "publicId", "code", "status", "details"],
    fields: [
      { name: "status", label: "Status", required: true },
      { name: "code", label: "Code" },
      { name: "details", label: "Details", type: "textarea" },
    ],
    displayFields: (raw) => [
      { label: "Status", value: scalarLabel(raw?.status) || "—" },
      { label: "Code", value: raw?.code || "—" },
      { label: "Details", value: raw?.details || "—" },
      {
        label: "Tracking number",
        value:
          scalarLabel(raw?.tracking_number) ||
          raw?.tracking_number?.tracking_number ||
          raw?.tracking_number_uuid ||
          "—",
      },
      { label: "Complete", value: raw?.complete ? "Yes" : "No" },
    ],
    listColumns: [
      {
        key: "status",
        header: "Status",
        sortable: true,
        render: (r) => (
          <span className="font-medium text-[#0A0E1A]">{scalarLabel(r.raw?.status) || r.name}</span>
        ),
      },
      {
        key: "code",
        header: "Code",
        render: (r) => <span className="font-mono text-xs">{r.raw?.code || "—"}</span>,
      },
      {
        key: "trackingNumber",
        header: "Tracking #",
        render: (r) => (
          <span className="font-mono text-xs">
            {scalarLabel(r.raw?.tracking_number) || r.raw?.tracking_number?.tracking_number || "—"}
          </span>
        ),
      },
      {
        key: "publicId",
        header: "Public ID",
        render: (r) => <span className="font-mono text-xs">{r.publicId}</span>,
      },
    ],
  },
  serviceRate: {
    key: "serviceRate",
    pluralLabel: "Service rates",
    singularLabel: "Service rate",
    section: "Operations",
    listPath: "/fleet-ops/operations/service-rates",
    permissionResource: "service-rate",
    formDialogSize: "lg",
    searchKeys: ["name", "publicId", "service_type", "service_name"],
    fields: [],
    listColumns: [
      {
        key: "name",
        header: "Name",
        sortable: true,
        render: (r) => <span className="text-[#0066FF] font-medium">{r.name}</span>,
      },
      { key: "service_type", header: "Type", render: (r) => r.raw?.service_type || "—" },
      { key: "method", header: "Method", render: (r) => r.raw?.rate_calculation_method || "—" },
      {
        key: "base_fee",
        header: "Base fee",
        render: (r) => formatMoney(r.raw?.base_fee, r.raw?.currency || "INR"),
      },
      { key: "per_distance", header: "Per distance", render: (r) => serviceRatePerDistanceLabel(r.raw || {}) },
      { key: "currency", header: "Currency", render: (r) => r.raw?.currency || "—" },
      { key: "publicId", header: "Public ID", render: (r) => <span className="font-mono text-xs">{r.publicId}</span> },
    ],
    displayFields: (raw) => [
      { label: "Name", value: raw?.service_name || "—" },
      { label: "Service type", value: raw?.service_type || "—" },
      { label: "Calculation method", value: raw?.rate_calculation_method || "—" },
      { label: "Base fee", value: formatMoney(raw?.base_fee, raw?.currency || "INR") },
      { label: "Per distance", value: serviceRatePerDistanceLabel(raw || {}) },
      { label: "Currency", value: raw?.currency || "—" },
    ],
  },
  fleet: {
    key: "fleet",
    pluralLabel: "Fleets",
    singularLabel: "Fleet",
    section: "Management",
    listPath: "/fleet-ops/management/fleets",
    permissionResource: "fleet",
    searchKeys: ["name", "publicId", "task", "status"],
    fields: [
      { name: "name", label: "Name", required: true },
      { name: "task", label: "Task / notes", type: "textarea" },
      { name: "status", label: "Status" },
      { name: "color", label: "Color" },
    ],
  },
};

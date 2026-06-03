/** Enterprise orders table — 18 configurable columns (G033). */

export const ORDERS_TABLE_COLUMNS = [
  { key: "risk", label: "", defaultVisible: true, sortable: false },
  { key: "publicId", label: "Order ID", defaultVisible: true, sortable: true },
  { key: "internalId", label: "Internal ID", defaultVisible: true, sortable: true },
  { key: "trackingNumber", label: "Tracking", defaultVisible: true, sortable: false },
  { key: "customer.name", label: "Customer", defaultVisible: true, sortable: true },
  { key: "route", label: "Route", defaultVisible: true, sortable: false },
  { key: "status", label: "Status", defaultVisible: true, sortable: true },
  { key: "priority", label: "Priority", defaultVisible: true, sortable: true },
  { key: "type", label: "Type", defaultVisible: false, sortable: false },
  { key: "serviceType", label: "Service", defaultVisible: false, sortable: false },
  { key: "scheduled_at", label: "Scheduled", defaultVisible: true, sortable: true },
  { key: "createdAt", label: "Created", defaultVisible: false, sortable: true },
  { key: "driverId", label: "Driver", defaultVisible: true, sortable: false },
  { key: "vehicleId", label: "Vehicle", defaultVisible: false, sortable: false },
  { key: "eta", label: "ETA", defaultVisible: true, sortable: false },
  { key: "total", label: "Total", defaultVisible: true, sortable: true },
  { key: "paymentStatus", label: "Payment", defaultVisible: false, sortable: false },
  { key: "notes", label: "Notes", defaultVisible: false, sortable: false },
];

const LAYOUT_STORAGE_KEY = "fleetops.orders.columnLayout.v1";

export function defaultHiddenColumnKeys() {
  return new Set(
    ORDERS_TABLE_COLUMNS.filter((c) => !c.defaultVisible).map((c) => c.key),
  );
}

export function parseHiddenColsParam(param) {
  if (!param?.trim()) return null;
  return new Set(param.split(",").map((k) => k.trim()).filter(Boolean));
}

export function hiddenColsToParam(hiddenSet) {
  const defaults = defaultHiddenColumnKeys();
  const hidden = [...hiddenSet].sort();
  const defaultArr = [...defaults].sort();
  if (hidden.length === defaultArr.length && hidden.every((k, i) => k === defaultArr[i])) {
    return "";
  }
  return hidden.join(",");
}

export function loadOrdersColumnLayout() {
  try {
    const raw = localStorage.getItem(LAYOUT_STORAGE_KEY);
    if (!raw) return defaultHiddenColumnKeys();
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed.hidden)) return new Set(parsed.hidden);
  } catch {
    /* ignore */
  }
  return defaultHiddenColumnKeys();
}

export function saveOrdersColumnLayout(hiddenSet) {
  try {
    localStorage.setItem(
      LAYOUT_STORAGE_KEY,
      JSON.stringify({ hidden: [...hiddenSet], updatedAt: new Date().toISOString() }),
    );
  } catch {
    /* ignore */
  }
}

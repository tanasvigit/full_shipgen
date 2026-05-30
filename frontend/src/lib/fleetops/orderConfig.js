import { normalizeStatus } from "@/domain/fleetops/status";

const STATUS_COLORS = {
  created: "#64748B",
  dispatched: "#0066FF",
  en_route: "#7C3AED",
  started: "#7C3AED",
  arrived: "#D97706",
  delivered: "#059669",
  completed: "#059669",
  canceled: "#DC2626",
  cancelled: "#DC2626",
  failed: "#B91C1C",
  delayed: "#EA580C",
};

export const DEFAULT_ORDER_FLOW = {
  activities: [
    { code: "created", status: "created", activities: ["dispatched"], logic: [], events: ["order.created"] },
    { code: "dispatched", status: "dispatched", activities: ["started"], logic: [], events: ["order.dispatched"] },
    { code: "started", status: "en_route", activities: ["completed"], logic: [], events: ["order.started"] },
    { code: "completed", status: "completed", activities: [], logic: [], events: ["order.completed"] },
    { code: "canceled", status: "canceled", activities: [], logic: [], events: ["order.canceled"] },
  ],
};

export function countFlowActivities(flow) {
  const list = flow?.activities;
  return Array.isArray(list) ? list.length : 0;
}

/** Collect unique status codes from flow graph nodes. */
export function extractStatusesFromFlow(flow) {
  const out = new Set();
  const walk = (nodes) => {
    if (!Array.isArray(nodes)) return;
    for (const node of nodes) {
      if (node?.status) out.add(normalizeStatus(node.status));
      if (node?.code) out.add(normalizeStatus(node.code));
      walk(node.activities?.filter?.((c) => typeof c === "object") ? node.activities : null);
    }
  };
  walk(flow?.activities);
  if (!out.size && flow?.created) {
    Object.keys(flow.created || {}).forEach((k) => out.add(normalizeStatus(k)));
  }
  return [...out];
}

export function statusColor(status, meta = {}) {
  const key = normalizeStatus(status);
  return meta?.status_colors?.[key] || meta?.statusColors?.[key] || STATUS_COLORS[key] || "#64748B";
}

export function mapOrderConfigRow(raw) {
  const id = raw?.uuid || raw?.id;
  const flow = raw?.flow && typeof raw.flow === "object" ? raw.flow : DEFAULT_ORDER_FLOW;
  const statuses = extractStatusesFromFlow(flow);
  const rowStatus = String(raw?.status || "active").toLowerCase();
  return {
    id: String(id || ""),
    publicId: raw?.public_id || raw?.id,
    name: raw?.name || raw?.key || "Untitled",
    key: raw?.key || "",
    description: raw?.description || "",
    type: raw?.type || "default",
    status: rowStatus,
    enabled: !["disabled", "archived", "inactive"].includes(rowStatus),
    version: raw?.version,
    flow,
    statuses,
    activityCount: countFlowActivities(flow),
    createdAt: raw?.created_at,
    updatedAt: raw?.updated_at,
    meta: raw?.meta || {},
    raw,
  };
}

export function buildOrderConfigPayload(values) {
  const flow = values.flow || DEFAULT_ORDER_FLOW;
  const statuses = extractStatusesFromFlow(flow);
  const status_colors = values.statusColors || {};
  statuses.forEach((s) => {
    if (!status_colors[s]) status_colors[s] = statusColor(s);
  });

  return {
    name: values.name,
    key: values.key || values.name?.toLowerCase?.().replace(/\s+/g, "_"),
    description: values.description || "",
    type: values.type || "default",
    status: values.enabled === false ? "disabled" : values.status || "active",
    flow,
    meta: {
      ...(values.meta || {}),
      status_colors,
    },
  };
}

export function emptyOrderConfigForm() {
  return {
    name: "",
    key: "",
    description: "",
    type: "default",
    enabled: true,
    status: "active",
    flow: structuredClone(DEFAULT_ORDER_FLOW),
    statusColors: { ...STATUS_COLORS },
    meta: {},
  };
}

export function orderConfigFormFromRow(row) {
  if (!row) return emptyOrderConfigForm();
  const colors = row.meta?.status_colors || row.meta?.statusColors || {};
  row.statuses?.forEach((s) => {
    if (!colors[s]) colors[s] = statusColor(s, row.meta);
  });
  return {
    name: row.name,
    key: row.key,
    description: row.description,
    type: row.type,
    enabled: row.enabled,
    status: row.status,
    flow: row.flow || structuredClone(DEFAULT_ORDER_FLOW),
    statusColors: colors,
    meta: row.meta || {},
  };
}

import { normalizeStatus, WORKFLOW_SCHEMA_FIELD_CODES } from "@/domain/fleetops/status";

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
    { code: "dispatched", status: "dispatched", activities: ["en_route"], logic: [], events: ["order.dispatched"] },
    { code: "en_route", status: "en_route", activities: ["arrived", "delivered"], logic: [], events: ["order.started"] },
    { code: "arrived", status: "arrived", activities: ["delivered"], logic: [], events: [] },
    { code: "delivered", status: "delivered", activities: ["completed"], logic: [], events: [] },
    { code: "completed", status: "completed", activities: [], logic: [], events: ["order.completed"] },
    { code: "canceled", status: "canceled", activities: [], logic: [], events: ["order.canceled"] },
  ],
};

/**
 * Normalize flow JSON from either UI shape (`{ activities: [...] }`) or
 * backend keyed shape (`{ created: {...}, dispatched: {...} }`).
 */
export function extractFlowActivityNodes(flow) {
  if (!flow || typeof flow !== "object") return [];

  if (Array.isArray(flow.activities) && flow.activities.length) {
    return flow.activities.filter((node) => node && typeof node === "object");
  }

  return Object.entries(flow)
    .filter(([key, node]) => key !== "activities" && node && typeof node === "object" && (node.code || node.key))
    .map(([, node]) => node)
    .sort((a, b) => (Number(a.sequence) || 0) - (Number(b.sequence) || 0));
}

export function countFlowActivities(flow) {
  return extractFlowActivityNodes(flow).length;
}

function addActivityStatus(out, node) {
  if (!node || typeof node !== "object") return;
  const code = normalizeStatus(node.code || node.key || node.status);
  if (code && !WORKFLOW_SCHEMA_FIELD_CODES.has(code)) out.add(code);
}

/** Collect unique status codes from flow graph nodes. */
export function extractStatusesFromFlow(flow) {
  const out = new Set();
  const walk = (nodes) => {
    if (!Array.isArray(nodes)) return;
    for (const node of nodes) {
      addActivityStatus(out, node);
      walk(node.activities?.filter?.((c) => typeof c === "object") ? node.activities : null);
    }
  };
  walk(extractFlowActivityNodes(flow));
  return [...out];
}

/** Convert keyed backend flow to editor-friendly `{ activities: [...] }`. */
export function normalizeFlowForEditor(flow) {
  const nodes = extractFlowActivityNodes(flow);
  if (!nodes.length) return structuredClone(DEFAULT_ORDER_FLOW);
  return {
    activities: nodes.map((node) => ({
      ...node,
      code: node.code || node.key,
      status: normalizeStatus(node.code || node.status || node.key),
      activities: Array.isArray(node.activities) ? [...node.activities] : [],
      logic: Array.isArray(node.logic) ? [...node.logic] : [],
      events: Array.isArray(node.events) ? [...node.events] : [],
    })),
  };
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
    flow: normalizeFlowForEditor(row.flow),
    statusColors: colors,
    meta: row.meta || {},
  };
}

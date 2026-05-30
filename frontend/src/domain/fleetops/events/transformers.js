import { formatDistanceToNow } from "date-fns";
import { resolveEventMeta } from "./registry";

function humanizeCode(code) {
  return String(code)
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Normalized operational event model. */
export function normalizeOperationalEvents(rawList = []) {
  if (!Array.isArray(rawList)) return [];

  return rawList
    .map((item, index) => {
      const code = String(item?.code || item?.status || item?.type || item?.event || "event").toLowerCase();
      const meta = resolveEventMeta(code);
      const at = item?.created_at || item?.updated_at || item?.timestamp || item?.date;
      const ts = at ? new Date(at) : null;

      return {
        id: item?.uuid || item?.id || `evt-${index}`,
        code,
        title: item?.title || item?.name || item?.description || humanizeCode(code),
        detail: item?.detail || item?.body || item?.comment || item?.notes || "",
        actor: item?.author?.name || item?.user?.name || item?.causer?.name || item?.driver?.name || "System",
        status: item?.status,
        icon: meta.icon,
        category: meta.category,
        severity: meta.severity,
        at: ts && !Number.isNaN(ts.getTime()) ? ts.toISOString() : null,
        relative: ts && !Number.isNaN(ts.getTime()) ? formatDistanceToNow(ts, { addSuffix: true }) : "",
        properties: item?.meta || item?.properties || {},
      };
    })
    .sort((a, b) => {
      if (!a.at) return 1;
      if (!b.at) return -1;
      return new Date(b.at) - new Date(a.at);
    });
}

export function eventsFromOrder(raw) {
  if (!raw) return [];
  const embedded = [
    ...(raw.activities || []),
    ...(raw.activity_log || []),
    ...(raw.timeline || []),
    ...(raw.events || []),
  ];
  if (embedded.length) return normalizeOperationalEvents(embedded);

  const synthetic = [];
  if (raw.created_at) synthetic.push({ code: "created", created_at: raw.created_at, title: "Order created" });
  if (raw.dispatched_at) synthetic.push({ code: "dispatched", created_at: raw.dispatched_at, title: "Order dispatched" });
  if (raw.started_at) synthetic.push({ code: "started", created_at: raw.started_at, title: "Route started" });
  if (raw.completed_at || raw.delivered_at) {
    synthetic.push({
      code: "completed",
      created_at: raw.completed_at || raw.delivered_at,
      title: "Order completed",
    });
  }
  const st = String(raw.status || "").toLowerCase();
  if (["canceled", "cancelled"].includes(st)) {
    synthetic.push({ code: "canceled", created_at: raw.updated_at, title: "Order canceled" });
  }
  return normalizeOperationalEvents(synthetic);
}

/** Append a local optimistic event (e.g. after transition). */
export function createSyntheticEvent({ code, title, detail, actor = "You" }) {
  const meta = resolveEventMeta(code);
  const at = new Date().toISOString();
  return {
    id: `local-${Date.now()}`,
    code,
    title: title || humanizeCode(code),
    detail: detail || "",
    actor,
    icon: meta.icon,
    category: meta.category,
    severity: meta.severity,
    at,
    relative: "just now",
    properties: { optimistic: true },
  };
}

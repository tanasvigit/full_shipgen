import { endOfDay, format, isValid, parseISO } from "date-fns";

/** Order has no driver assigned — eligible for best-fit. */
export function isUnassignedFleetOrder(order) {
  if (!order) return false;
  if (order.hasDriverAssigned === false) return true;
  return !order.driverId;
}

/** Comma range for OrderFilter scheduled_at (inclusive through end of last day). */
export function fleetScheduleWeekRange(weekStart, weekEnd) {
  return `${format(weekStart, "yyyy-MM-dd")},${format(endOfDay(weekEnd), "yyyy-MM-dd HH:mm:ss")}`;
}

/** Calendar day key (yyyy-MM-dd) for grid columns — uses local date for datetimes, literal for date-only strings. */
export function orderScheduledDayKey(order) {
  const raw = order?.scheduledAt;
  if (!raw) return null;
  const text = String(raw).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return text;
  const d = parseISO(text);
  if (!isValid(d)) return text.slice(0, 10);
  return format(d, "yyyy-MM-dd");
}

/** Prefer the most recent non-null scheduled_at when merging list rows. */
function pickScheduledAt(existing, incoming) {
  if (!existing) return incoming || null;
  if (!incoming) return existing || null;
  const a = new Date(existing).getTime();
  const b = new Date(incoming).getTime();
  if (Number.isNaN(a)) return incoming;
  if (Number.isNaN(b)) return existing;
  return b >= a ? incoming : existing;
}

/** Merge list rows — week query (scheduled) must not lose scheduled_at to unassigned query. */
export function mergeMappedFleetOrder(existing, incoming) {
  if (!incoming) return existing;
  if (!existing) return incoming;
  return {
    ...existing,
    ...incoming,
    scheduledAt: pickScheduledAt(existing.scheduledAt, incoming.scheduledAt),
    driverId: incoming.driverId ?? existing.driverId,
    hasDriverAssigned: incoming.hasDriverAssigned ?? existing.hasDriverAssigned,
  };
}

/** Build order map from unassigned + in-week list responses. */
export function buildFleetScheduleOrderMap(unassignedRaw = [], weekRaw = [], mapOrder) {
  const merged = new Map();
  for (const raw of unassignedRaw) {
    const mapped = mapOrder(raw);
    merged.set(mapped.id, mapped);
  }
  for (const raw of weekRaw) {
    const mapped = mapOrder(raw);
    merged.set(mapped.id, mergeMappedFleetOrder(merged.get(mapped.id), mapped));
  }
  return merged;
}

/** Apply schedule API results to mapped orders (optimistic UI before reload). */
export function patchOrdersWithSchedule(orders, results = []) {
  if (!Array.isArray(results) || !results.length) return orders;

  const byId = new Map(
    results
      .filter((row) => row?.id && row?.scheduledAt)
      .map((row) => [String(row.id), row.scheduledAt]),
  );

  if (!byId.size) return orders;

  return orders.map((order) => {
    const scheduledAt = byId.get(String(order.id));
    return scheduledAt ? { ...order, scheduledAt } : order;
  });
}

const UNASSIGNED_REASON_LABELS = {
  no_shift: "no driver on shift for the scheduled time",
  no_match: "no eligible driver (skills or proximity)",
  no_drivers: "no drivers in pool",
};

/** Human-readable summary after orchestrator best-fit. */
export function summarizeBestFitResult(result, { skippedAssigned = 0 } = {}) {
  const applied = result?.summary?.applied ?? result?.summary?.orders_assigned ?? result?.assignments?.length ?? 0;
  const unassigned = Array.isArray(result?.unassigned) ? result.unassigned : [];
  const message = result?.message || "";

  if (skippedAssigned > 0 && applied === 0 && unassigned.length === 0) {
    return {
      tone: "error",
      text: `${skippedAssigned} selected order(s) already have a driver. Select unassigned orders from the Unassigned row.`,
    };
  }

  if (/already have/i.test(message)) {
    return { tone: "error", text: message };
  }

  if (applied > 0) {
    let text = `Best-fit assigned ${applied} order(s)`;
    if (unassigned.length) {
      text += ` · ${unassigned.length} could not be matched`;
    }
    return { tone: "success", text };
  }

  if (unassigned.length) {
    const reasons = [...new Set(unassigned.map((u) => UNASSIGNED_REASON_LABELS[u.reason] || u.reason).filter(Boolean))];
    return {
      tone: "warning",
      text: reasons.length
        ? `No orders assigned — ${reasons.join("; ")}`
        : `${unassigned.length} order(s) could not be assigned`,
    };
  }

  if (/no unassigned/i.test(message)) {
    return {
      tone: "warning",
      text: "No unassigned orders in your selection. Pick orders from the Unassigned row.",
    };
  }

  return { tone: "info", text: message || "No orders were assigned" };
}

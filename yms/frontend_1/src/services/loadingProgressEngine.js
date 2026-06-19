/**
 * Loading session progress, ETA, and health — dock SLA driven (no fixed 75/90 min).
 */

export const DEFAULT_ESTIMATED_DURATION_MIN = 90;
export const HEALTH = {
  ON_TIME: "ON_TIME",
  AT_RISK: "AT_RISK",
  DELAYED: "DELAYED",
};

export const OPERATION_HEALTH = {
  ...HEALTH,
  PAUSED: "PAUSED",
};

export function resolveEstimatedDurationMin(dock) {
  const raw = dock?.estimated_service_time_min ?? dock?.estimatedServiceTimeMin;
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : DEFAULT_ESTIMATED_DURATION_MIN;
}

function eventTimeMs(iso) {
  if (!iso) return NaN;
  const t = new Date(iso).getTime();
  return Number.isFinite(t) ? t : NaN;
}

function findLatestEvent(events, vehicleId, eventType) {
  return [...(events || [])]
    .filter((e) => e.vehicle_id === vehicleId && e.event_type === eventType)
    .sort((a, b) => eventTimeMs(b.event_time) - eventTimeMs(a.event_time))[0];
}

/**
 * @returns {{ loading_started_at: string|null, loading_completed_at: string|null, estimated_duration_min: number }}
 */
export function buildLoadingSession({ events, vehicleId, dock }) {
  const started = vehicleId ? findLatestEvent(events, vehicleId, "LOADING_STARTED") : null;
  const completed = vehicleId ? findLatestEvent(events, vehicleId, "LOADING_COMPLETED") : null;
  return {
    loading_started_at: started?.event_time ?? null,
    loading_completed_at: completed?.event_time ?? null,
    estimated_duration_min: resolveEstimatedDurationMin(dock),
  };
}

export function formatEtaClock(isoOrMs) {
  const ms = typeof isoOrMs === "number" ? isoOrMs : eventTimeMs(isoOrMs);
  if (!Number.isFinite(ms)) return "—";
  return new Date(ms).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
}

export function resolveHealthFromRatio(ratioPct) {
  if (ratioPct > 100) return HEALTH.DELAYED;
  if (ratioPct >= 80) return HEALTH.AT_RISK;
  return HEALTH.ON_TIME;
}

export function healthAccent(health) {
  switch (health) {
    case HEALTH.DELAYED:
      return "danger";
    case HEALTH.AT_RISK:
      return "warning";
    default:
      return "success";
  }
}

export function healthClassName(health) {
  switch (health) {
    case HEALTH.DELAYED:
      return "text-red-700 bg-red-50 border-red-200";
    case HEALTH.AT_RISK:
      return "text-amber-800 bg-amber-50 border-amber-200";
    case OPERATION_HEALTH.PAUSED:
      return "text-slate-700 bg-slate-100 border-slate-300";
    default:
      return "text-emerald-700 bg-emerald-50 border-emerald-200";
  }
}

/**
 * @param {ReturnType<typeof buildLoadingSession>} session
 * @param {{ now?: number, isCompleted?: boolean, isLoading?: boolean }} opts
 */
export function computeLoadingMetrics(session, opts = {}) {
  const now = opts.now ?? Date.now();
  const estimated = session.estimated_duration_min || DEFAULT_ESTIMATED_DURATION_MIN;
  const empty = {
    progressPct: 0,
    health: HEALTH.ON_TIME,
    etaCompletionIso: null,
    etaCompletionLabel: "—",
    remainingLabel: "—",
    remainingMin: null,
    elapsedMin: 0,
    overdueMin: 0,
    delayMin: 0,
    delayed: false,
    progressEstimated: false,
    plannedDurationMin: estimated,
    actualDurationMin: null,
    varianceMin: null,
    varianceLabel: "—",
  };

  if (!session.loading_started_at) {
    return empty;
  }

  const startMs = eventTimeMs(session.loading_started_at);
  const completedMs = session.loading_completed_at
    ? eventTimeMs(session.loading_completed_at)
    : null;
  const endMs = completedMs ?? now;
  const wallElapsedMin = Math.max(0, Math.floor((endMs - startMs) / 60000));
  const pausedMin = Math.max(0, Math.floor((opts.pausedMs || 0) / 60000));
  const elapsedMin = Math.max(0, wallElapsedMin - pausedMin);
  const ratioPct = (elapsedMin / estimated) * 100;

  if (opts.isCompleted || completedMs) {
    const varianceMin = elapsedMin - estimated;
    return {
      ...empty,
      progressPct: 100,
      health: resolveHealthFromRatio(ratioPct),
      elapsedMin,
      actualDurationMin: elapsedMin,
      varianceMin,
      varianceLabel: varianceMin === 0 ? "0 min" : `${varianceMin > 0 ? "+" : ""}${varianceMin} min`,
      delayed: ratioPct > 100,
      delayMin: Math.max(0, elapsedMin - estimated),
    };
  }

  if (!opts.isLoading && opts.isLoading !== undefined) {
    return empty;
  }

  const progressPct = Math.min(99, Math.max(0, Math.round(ratioPct)));
  const etaCompletionMs = startMs + estimated * 60000;
  const remainingMin = Math.ceil((etaCompletionMs - now) / 60000);
  const overdueMin = remainingMin < 0 ? Math.abs(remainingMin) : 0;
  const health = resolveHealthFromRatio(ratioPct);

  return {
    progressPct,
    health,
    etaCompletionIso: new Date(etaCompletionMs).toISOString(),
    etaCompletionLabel: `ETA ${formatEtaClock(etaCompletionMs)}`,
    remainingLabel:
      overdueMin > 0 ? `Overdue by ${overdueMin} min` : `${Math.max(0, remainingMin)} min remaining`,
    remainingMin: overdueMin > 0 ? -overdueMin : Math.max(0, remainingMin),
    elapsedMin,
    overdueMin,
    delayMin: Math.max(0, elapsedMin - estimated),
    delayed: health === HEALTH.DELAYED,
    progressEstimated: false,
    plannedDurationMin: estimated,
    actualDurationMin: null,
    varianceMin: null,
    varianceLabel: "—",
  };
}

export function formatVariance(varianceMin) {
  if (varianceMin == null) return "—";
  if (varianceMin === 0) return "0 min";
  return `${varianceMin > 0 ? "+" : ""}${varianceMin} min`;
}

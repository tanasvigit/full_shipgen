type YardEventRow = Record<string, unknown>;

function eventTimeMs(value: unknown): number {
  if (!value) return 0;
  const ms = new Date(String(value)).getTime();
  return Number.isFinite(ms) ? ms : 0;
}

function matchesLoadingEvent(
  event: YardEventRow,
  vehicleId?: string | null,
  queueEntryId?: string | null,
) {
  if (vehicleId && String(event.vehicle_id || "") === String(vehicleId)) return true;
  if (queueEntryId && String(event.queue_entry_id || "") === String(queueEntryId)) return true;
  return false;
}

/** Mirrors YMS compute_loading_complete_state — LOADING_COMPLETED without DOCK_RELEASED. */
export function computeLoadingCompleteState(
  events: YardEventRow[],
  vehicleId?: string | null,
  queueEntryId?: string | null,
) {
  const relevant = events
    .filter((event) => matchesLoadingEvent(event, vehicleId, queueEntryId))
    .sort((a, b) => eventTimeMs(a.event_time) - eventTimeMs(b.event_time));

  let lastStartedMs = 0;
  let lastCompletedMs = 0;
  let lastReleasedMs = 0;
  let completedAt: string | null = null;

  for (const event of relevant) {
    const type = String(event.event_type || "");
    const timeMs = eventTimeMs(event.event_time);
    if (type === "LOADING_STARTED" && timeMs) {
      lastStartedMs = timeMs;
    } else if (type === "LOADING_COMPLETED" && timeMs) {
      lastCompletedMs = timeMs;
      completedAt = String(event.event_time);
    } else if (type === "DOCK_RELEASED" && timeMs) {
      lastReleasedMs = timeMs;
    }
  }

  const startedOk = !lastStartedMs || lastCompletedMs >= lastStartedMs;
  const releasedOk = !lastReleasedMs || lastReleasedMs < lastCompletedMs;
  const awaitingRelease = lastCompletedMs > 0 && startedOk && releasedOk;

  return {
    awaitingRelease,
    loadingCompleted: awaitingRelease,
    completedAt: awaitingRelease ? completedAt : null,
  };
}

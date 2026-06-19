function eventTimeMs(iso) {
  if (!iso) return NaN;
  const t = new Date(iso).getTime();
  return Number.isFinite(t) ? t : NaN;
}

function matchesOp(event, { vehicleId, queueEntryId }) {
  if (vehicleId && event.vehicle_id === vehicleId) return true;
  if (queueEntryId && event.queue_entry_id === queueEntryId) return true;
  return false;
}

/**
 * Build pause intervals and active pause from LOADING_PAUSED / LOADING_RESUMED events.
 */
export function computePauseState(events, { vehicleId, queueEntryId }, now = Date.now()) {
  const relevant = (events || [])
    .filter(
      (e) =>
        matchesOp(e, { vehicleId, queueEntryId }) &&
        (e.event_type === "LOADING_PAUSED" || e.event_type === "LOADING_RESUMED")
    )
    .sort((a, b) => eventTimeMs(a.event_time) - eventTimeMs(b.event_time));

  const intervals = [];
  let openPause = null;
  let totalPausedMin = 0;

  for (const event of relevant) {
    if (event.event_type === "LOADING_PAUSED") {
      openPause = event;
    } else if (event.event_type === "LOADING_RESUMED" && openPause) {
      const startMs = eventTimeMs(openPause.event_time);
      const endMs = eventTimeMs(event.event_time);
      if (Number.isFinite(startMs) && Number.isFinite(endMs)) {
        const minutes = Math.max(0, Math.floor((endMs - startMs) / 60000));
        totalPausedMin += minutes;
        intervals.push({
          startedAt: openPause.event_time,
          resumedAt: event.event_time,
          reason: openPause.event_note,
          durationMin: minutes,
        });
      }
      openPause = null;
    }
  }

  const paused = !!openPause;
  let pausedDurationMin = 0;
  if (paused && openPause) {
    const startMs = eventTimeMs(openPause.event_time);
    if (Number.isFinite(startMs)) {
      pausedDurationMin = Math.max(0, Math.floor((now - startMs) / 60000));
      totalPausedMin += pausedDurationMin;
    }
  }

  return {
    paused,
    pausedSince: openPause?.event_time ?? null,
    pauseReason: openPause?.event_note ?? null,
    pausedDurationMin,
    totalPausedMin,
    intervals,
  };
}

export function pausedMsFromState(pauseState, now = Date.now()) {
  if (!pauseState) return 0;
  let ms = (pauseState.intervals || []).reduce((sum, iv) => {
    const s = eventTimeMs(iv.startedAt);
    const e = eventTimeMs(iv.resumedAt);
    return sum + (Number.isFinite(s) && Number.isFinite(e) ? e - s : 0);
  }, 0);
  if (pauseState.paused && pauseState.pausedSince) {
    const s = eventTimeMs(pauseState.pausedSince);
    if (Number.isFinite(s)) ms += now - s;
  }
  return ms;
}

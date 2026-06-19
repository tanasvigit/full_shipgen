import { useEffect } from "react";
import { onYmsDataChanged } from "../services/ymsSync";

/** Fallback polling interval for operational screens during live demos. */
export const OPERATIONAL_POLL_MS = 30_000;

/**
 * Subscribe to yms-data-changed and poll on an interval so operator screens stay current.
 * @param {() => void | Promise<void>} refreshFn
 * @param {boolean} [enabled=true]
 * @param {number} [pollMs=OPERATIONAL_POLL_MS]
 */
export function useOperationalAutoRefresh(refreshFn, enabled = true, pollMs = OPERATIONAL_POLL_MS) {
  useEffect(() => {
    if (!enabled || typeof refreshFn !== "function") return undefined;
    const run = () => {
      refreshFn();
    };
    const unsub = onYmsDataChanged(run);
    const id = setInterval(run, pollMs);
    return () => {
      unsub();
      clearInterval(id);
    };
  }, [refreshFn, enabled, pollMs]);
}

export default useOperationalAutoRefresh;

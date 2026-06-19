import { useEffect } from "react";
import { onYmsDataChanged } from "../services/ymsSync";

/**
 * Re-run refresh when any YMS mutation broadcasts yms-data-changed.
 * @param {() => void | Promise<void>} refreshFn
 * @param {boolean} [enabled=true] - When false (e.g. drawer closed), skip subscription
 */
export function useYmsSyncRefresh(refreshFn, enabled = true) {
  useEffect(() => {
    if (!enabled || typeof refreshFn !== "function") return undefined;
    return onYmsDataChanged(() => {
      refreshFn();
    });
  }, [refreshFn, enabled]);
}

export default useYmsSyncRefresh;

import { useCallback, useEffect, useId, useState } from "react";
import { loadingManager } from "@/services/loading-manager";

/**
 * Page/section scoped loader tied to loading-manager scoped keys.
 */
export function usePageLoader(defaultMessage = "Loading…") {
  const scopeKey = useId().replace(/:/g, "");
  const [snap, setSnap] = useState(() => loadingManager.getSnapshot());

  useEffect(() => loadingManager.subscribe(setSnap), []);

  const scoped = snap.scoped[scopeKey];

  const start = useCallback(
    (message = defaultMessage) => {
      loadingManager.setScoped(scopeKey, true, message);
    },
    [scopeKey, defaultMessage],
  );

  const stop = useCallback(() => {
    loadingManager.setScoped(scopeKey, false);
  }, [scopeKey]);

  const run = useCallback(
    async (fn, message = defaultMessage) => {
      start(message);
      try {
        return await fn();
      } finally {
        stop();
      }
    },
    [start, stop, defaultMessage],
  );

  return {
    loading: Boolean(scoped?.active),
    message: scoped?.message || defaultMessage,
    start,
    stop,
    run,
    testId: "page-loader",
  };
}

import { useCallback, useEffect, useMemo, useState } from "react";
import { loadingManager } from "@/services/loading-manager";

export function useLoadingState(scopeKey) {
  const [snap, setSnap] = useState(() => loadingManager.getSnapshot());

  useEffect(() => loadingManager.subscribe(setSnap), []);

  const scoped = scopeKey ? snap.scoped[scopeKey] : null;

  const setLoading = useCallback(
    (active, message = "") => {
      if (scopeKey) loadingManager.setScoped(scopeKey, active, message);
    },
    [scopeKey],
  );

  return useMemo(
    () => ({
      ...snap,
      scoped,
      isLoading: Boolean(scoped?.active),
      message: scoped?.message || "",
      setLoading,
    }),
    [snap, scoped, setLoading],
  );
}

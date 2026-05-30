import { useCallback, useEffect, useState } from "react";
import { loadingManager } from "@/services/loading-manager";

export function useGlobalLoader() {
  const [snap, setSnap] = useState(() => loadingManager.getSnapshot());

  useEffect(() => loadingManager.subscribe(setSnap), []);

  const show = useCallback((message) => {
    loadingManager.setGlobal(true, message);
  }, []);

  const hide = useCallback(() => {
    loadingManager.setGlobal(false);
  }, []);

  const visible =
    snap.bootstrap.active || snap.auth.active || snap.global.active;

  const message =
    snap.bootstrap.message || snap.auth.message || snap.global.message || "Loading…";

  return {
    visible,
    message,
    progressActive: snap.progressActive,
    show,
    hide,
    setBootstrap: loadingManager.setBootstrap.bind(loadingManager),
    setAuth: loadingManager.setAuth.bind(loadingManager),
  };
}

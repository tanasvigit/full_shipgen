import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { loadingManager } from "@/services/loading-manager";
import GlobalLoaderOverlay from "@/components/loaders/overlays/GlobalLoaderOverlay";
import "@/components/loaders/Spinner/spinner.css";

const LoadingContext = createContext(null);

export function LoadingProvider({ children }) {
  const [snap, setSnap] = useState(() => loadingManager.getSnapshot());

  useEffect(() => {
    const el = document.getElementById("boot-loader");
    if (el) el.remove();
    return loadingManager.subscribe(setSnap);
  }, []);

  const value = useMemo(
    () => ({
      snapshot: snap,
      manager: loadingManager,
      trackApi: (opts) => loadingManager.trackApi(opts),
    }),
    [snap],
  );

  return (
    <LoadingContext.Provider value={value}>
      <GlobalLoaderOverlay
        bootstrap={snap.bootstrap.active}
        auth={snap.auth.active}
        global={snap.global.active}
        message={
          snap.bootstrap.message || snap.auth.message || snap.global.message || "Loading…"
        }
      />
      {children}
    </LoadingContext.Provider>
  );
}

export function useLoadingContext() {
  const ctx = useContext(LoadingContext);
  if (!ctx) {
    throw new Error("useLoadingContext must be used within LoadingProvider");
  }
  return ctx;
}

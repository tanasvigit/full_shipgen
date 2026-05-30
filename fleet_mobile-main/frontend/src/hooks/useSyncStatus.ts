import { useCallback, useEffect, useState } from "react";
import { useCompanyScope } from "@/src/hooks/useCompanyScope";
import { offlineQueue } from "@/src/offline/queue";
import { subscribeNetwork } from "@/src/offline/network";
import { flushOfflineQueue } from "@/src/offline/processor";
import { deriveSyncSnapshot, getTrackingRunning, type SyncSnapshot } from "@/src/sync/statusMachine";

export function useSyncStatus() {
  const { companyUuid } = useCompanyScope();
  const [snapshot, setSnapshot] = useState<SyncSnapshot | null>(null);
  const [syncing, setSyncing] = useState(false);

  const refresh = useCallback(async () => {
    await offlineQueue.ensureLoaded();
    const all = offlineQueue.getSnapshot();
    const scoped = companyUuid ? all.filter((item) => item.companyUuid === companyUuid) : all;
    const pendingCount = scoped.filter((item) => item.state === "pending" || item.state === "failed").length;
    const deadLetterCount = scoped.filter((item) => item.state === "dead-letter").length;

    setSnapshot(
      deriveSyncSnapshot({
        pendingCount,
        deadLetterCount,
        syncing,
        trackingRunning: getTrackingRunning(),
      })
    );
  }, [companyUuid, syncing]);

  useEffect(() => {
    void refresh();
    const timer = setInterval(() => {
      void refresh();
    }, 3_000);
    const unsub = subscribeNetwork(() => {
      void refresh();
    });
    return () => {
      clearInterval(timer);
      unsub();
    };
  }, [refresh]);

  const retrySync = useCallback(async () => {
    if (!companyUuid) return;
    setSyncing(true);
    try {
      await flushOfflineQueue(companyUuid);
    } finally {
      setSyncing(false);
      await refresh();
    }
  }, [companyUuid, refresh]);

  return {
    snapshot,
    refresh,
    retrySync,
    pendingCount: snapshot?.pendingCount || 0,
    deadLetterCount: snapshot?.deadLetterCount || 0,
  };
}

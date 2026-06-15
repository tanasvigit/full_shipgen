import { useCallback, useEffect, useRef, useState } from "react";
import { useCompanyScope } from "@/src/hooks/useCompanyScope";
import { offlineQueue } from "@/src/offline/queue";
import { subscribeNetwork } from "@/src/offline/network";
import { recoverSyncFailures } from "@/src/offline/processor";
import { bindTrackingOrder } from "@/src/runtime/lifecycle";
import { getRuntimeSession } from "@/src/runtime/session";
import {
  deriveSyncSnapshot,
  getTrackingRunning,
  shouldExpectTrackingRunning,
  type SyncSnapshot,
} from "@/src/sync/statusMachine";

export function useSyncStatus() {
  const { companyUuid } = useCompanyScope();
  const [snapshot, setSnapshot] = useState<SyncSnapshot | null>(null);
  const [syncing, setSyncing] = useState(false);
  const autoRecoveredRef = useRef<string | null>(null);

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
        trackingExpected: shouldExpectTrackingRunning(),
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

  useEffect(() => {
    if (!companyUuid || autoRecoveredRef.current === companyUuid) return;
    void (async () => {
      await offlineQueue.ensureLoaded();
      if (offlineQueue.getDeadLetter(companyUuid).length === 0) return;
      autoRecoveredRef.current = companyUuid;
      setSyncing(true);
      try {
        await recoverSyncFailures(companyUuid);
      } finally {
        setSyncing(false);
        await refresh();
      }
    })();
  }, [companyUuid, refresh]);

  const retrySync = useCallback(async () => {
    if (!companyUuid) return;
    setSyncing(true);
    try {
      await recoverSyncFailures(companyUuid);
      const session = getRuntimeSession();
      if (session?.activeOrderId && shouldExpectTrackingRunning() && !getTrackingRunning()) {
        await bindTrackingOrder(session.activeOrderId);
      }
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

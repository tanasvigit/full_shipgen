import { queryClient } from "@/src/query/client";
import { getStoredOrganization } from "@/src/lib/api";
import { createPermissionResolver } from "@/src/services/permissions";
import { workflowService } from "@/src/services/workflowService";
import { offlineQueue } from "@/src/offline/queue";
import { getNetworkOnline } from "@/src/offline/network";
import { realtimeClient } from "@/src/realtime/client";
import { realtimeSubscriptions } from "@/src/realtime/subscriptions";
import { getResyncTimestamps } from "@/src/realtime/resync";
import { trackingEngine } from "@/src/tracking/engine";
import { getRuntimeSession } from "@/src/runtime/lifecycle";
import type { UserDTO } from "@/src/types/api/auth";

function devOnly() {
  return __DEV__;
}

export async function logCurrentOrganization() {
  if (!devOnly()) return;
  const org = await getStoredOrganization();
  console.log("[dev:org]", org);
}

export function logQueryCacheSnapshot(label = "cache") {
  if (!devOnly()) return;
  const entries = queryClient
    .getQueryCache()
    .getAll()
    .map((query) => ({
      key: query.queryKey,
      state: query.state.status,
      dataUpdatedAt: query.state.dataUpdatedAt,
    }));
  console.log(`[dev:${label}]`, entries);
}

export function logPermissionInspection(user: UserDTO | null | undefined) {
  if (!devOnly()) return;
  const resolver = createPermissionResolver(user);
  console.log("[dev:permissions]", {
    isAdmin: resolver.isAdmin,
    permissions: [...resolver.permissions],
    canDispatchOrder: resolver.canFleetops("dispatch", "order"),
    canUpdateOrder: resolver.canFleetops("update", "order"),
  });
}

export async function logWorkflowDebug(orderId: string) {
  if (!devOnly()) return;
  try {
    const activities = await workflowService.getNextActivities(orderId);
    const next = await workflowService.getNextActivity(orderId);
    console.log("[dev:workflow]", { orderId, activities, next });
  } catch (error) {
    console.log("[dev:workflow:error]", { orderId, error });
  }
}

export async function logRuntimeDiagnostics() {
  if (!devOnly()) return;
  await offlineQueue.ensureLoaded();
  const companyUuid = getRuntimeSession()?.companyUuid;
  const pending = offlineQueue.getPending(companyUuid || undefined);

  console.log("[dev:runtime]", {
    socket: realtimeClient.getStatus(),
    channels: realtimeSubscriptions.getActiveChannels(),
    networkOnline: getNetworkOnline(),
    queueDepth: pending.length,
    pendingTypes: pending.map((item) => item.type),
    resync: getResyncTimestamps(),
    tracking: trackingEngine.getState(),
    session: getRuntimeSession(),
  });
}

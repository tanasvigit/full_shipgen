import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { realtimeSubscriptions } from "@/src/realtime/subscriptions";
import { colors, radius, spacing } from "@/src/theme";
import * as Haptics from "expo-haptics";
import ScreenHeader from "@/src/components/ScreenHeader";
import StatusBadge from "@/src/components/StatusBadge";
import TripMap from "@/src/maps/tripMap";
import { tripMarkersFromOrder } from "@/src/maps/coordinates";
import { SyncBanner, SyncChip } from "@/src/sync/indicators";
import { useSyncStatus } from "@/src/hooks/useSyncStatus";
import { ConflictList } from "@/src/offline/conflicts/ui";
import { listConflicts } from "@/src/offline/conflicts/resolver";
import { SignatureCapture } from "@/src/pod/ui/SignatureCapture";
import { PhotoCapture } from "@/src/pod/ui/PhotoCapture";
import { QRScanner } from "@/src/pod/ui/QRScanner";
import { trackEvent } from "@/src/analytics/tracker";
import { AnalyticsEvents } from "@/src/analytics/events";
import { useDriverOrders } from "@/src/hooks/useDriverOrders";
import { useOrderQuery } from "@/src/hooks/useOrderQuery";
import { useNextActivityQuery } from "@/src/hooks/useNextActivityQuery";
import { usePermissions } from "@/src/hooks/usePermissions";
import {
  useAdvanceActivityMutation,
  useCompleteOrderMutation,
  useStartTripMutation,
} from "@/src/hooks/mutations/useWorkflowMutations";
import { usePodMutation } from "@/src/hooks/mutations/usePodMutation";
import { canCompleteOrder, canStartTrip, isTerminalStatus } from "@/src/lib/orderStatus";
import type { Order } from "@/src/data/types";

export default function OrderDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const orderRef = String(id);
  const { findOrder } = useDriverOrders();
  const cached = findOrder(orderRef);
  const orderQuery = useOrderQuery(orderRef, { code: cached?.code });
  const order = orderQuery.data ?? cached ?? null;
  const nextActivityQuery = useNextActivityQuery(order?.id);
  const nextActivity = nextActivityQuery.data ?? null;

  const startTripMutation = useStartTripMutation();
  const advanceMutation = useAdvanceActivityMutation();
  const completeMutation = useCompleteOrderMutation();
  const podMutation = usePodMutation();

  const [podStatus, setPodStatus] = useState<string | null>(null);
  const [podUploadState, setPodUploadState] = useState<"staged" | "queued" | "uploading" | "uploaded" | "failed">("staged");
  const [workflowError, setWorkflowError] = useState<string | null>(null);
  const [conflicts, setConflicts] = useState<Awaited<ReturnType<typeof listConflicts>>>([]);
  const permissions = usePermissions();
  const { snapshot: syncSnapshot, retrySync } = useSyncStatus();

  const workflowBusy =
    startTripMutation.isPending || advanceMutation.isPending || completeMutation.isPending;
  const loadingOrder = orderQuery.isLoading && !order;

  const optimisticOrder = useMemo(() => {
    if (!order) return null;
    if (startTripMutation.isPending) return { ...order, status: "started" } as Order;
    if (completeMutation.isPending) return { ...order, status: "completed" } as Order;
    return order;
  }, [completeMutation.isPending, order, startTripMutation.isPending]);

  const displayOrder = optimisticOrder || order;
  const mapModel = useMemo(
    () => (displayOrder ? tripMarkersFromOrder(displayOrder) : null),
    [displayOrder]
  );

  useEffect(() => {
    const channelRef = displayOrder?.code || displayOrder?.id;
    if (!channelRef) return;
    void realtimeSubscriptions.trackOrder(channelRef);
    return () => {
      void realtimeSubscriptions.untrackOrder(channelRef);
    };
  }, [displayOrder?.code, displayOrder?.id]);

  useEffect(() => {
    void listConflicts().then(setConflicts);
  }, [syncSnapshot?.pendingCount, syncSnapshot?.deadLetterCount, podStatus]);


  const runWorkflowAction = async (action: "start" | "advance" | "complete") => {
    if (!displayOrder) return;
    try {
      setWorkflowError(null);
      if (action === "start") {
        await startTripMutation.mutateAsync(displayOrder.id);
      } else if (action === "advance") {
        await advanceMutation.mutateAsync({
          orderId: displayOrder.id,
          activityCode: nextActivity?.code,
        });
      } else {
        await completeMutation.mutateAsync(displayOrder.id);
      }
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      trackEvent(
        action === "complete" ? AnalyticsEvents.WORKFLOW_COMPLETE : AnalyticsEvents.WORKFLOW_START,
        { orderId: displayOrder.id, action }
      );
    } catch (error) {
      setWorkflowError(error instanceof Error ? error.message : "Workflow action failed");
    }
  };

  const uploadPod = async (kind: "signature" | "photo" | "qr", value: string) => {
    if (!displayOrder) return;
    try {
      setPodStatus(null);
      setPodUploadState("uploading");
      const result = await podMutation.mutateAsync({ kind, orderId: displayOrder.id, value });
      setPodUploadState(result?.queued ? "queued" : "uploaded");
      setPodStatus(`${kind} captured`);
      trackEvent(AnalyticsEvents.POD_UPLOAD_SUCCESS, { kind, orderId: displayOrder.id });
    } catch (error) {
      setPodUploadState("failed");
      setPodStatus(error instanceof Error ? error.message : "POD upload failed");
    }
  };

  if (loadingOrder) {
    return (
      <SafeAreaView style={styles.safe}>
        <ScreenHeader title="Order" back />
        <View style={styles.empty}>
          <ActivityIndicator color={colors.text} />
          <Text style={styles.emptyText}>Loading order...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!displayOrder) {
    return (
      <SafeAreaView style={styles.safe}>
        <ScreenHeader title="Order" back />
        <View style={styles.empty}>
          <Text style={styles.emptyText}>Order not found.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const canStart = canStartTrip(displayOrder.status);
  const canAdvance = Boolean(nextActivity?.code) && !isTerminalStatus(displayOrder.status);
  const canComplete = canCompleteOrder(displayOrder.status);
  const hasWorkflowPermission = permissions.canUpdateOrder || permissions.canDispatchOrder;
  const workflowDisabledReason = !hasWorkflowPermission
    ? permissions.permissionReason("update", "order")
    : !canStart && !canAdvance && !canComplete
      ? "Order state does not allow this workflow action."
      : null;

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScreenHeader title={displayOrder.code} subtitle={displayOrder.customer} back rightIcon="ellipsis-horizontal" />
      <SyncBanner snapshot={syncSnapshot} onRetry={retrySync} compact />
      <ScrollView contentContainerStyle={styles.scroll}>
        {mapModel ? (
          <TripMap
            height={200}
            markers={[mapModel.pickup, mapModel.dropoff, mapModel.driver]}
            route={mapModel.route}
            activeMarkerId="driver"
          />
        ) : null}
        {syncSnapshot && syncSnapshot.pendingCount > 0 ? (
          <SyncChip label={`Sync pending (${syncSnapshot.pendingCount})`} />
        ) : null}
        <ConflictList
          conflicts={conflicts.filter((row) => !row.orderId || row.orderId === displayOrder.id)}
          onRefresh={() => orderQuery.refetch()}
          onDismiss={() => {
            void listConflicts().then(setConflicts);
          }}
        />

        <View style={styles.card}>
          <View style={styles.rowBetween}>
            <Text style={styles.sectionLabel}>STATUS</Text>
            <StatusBadge status={displayOrder.status} />
          </View>
          <View style={styles.metaGrid}>
            <Cell label="DISTANCE" value={displayOrder.distance} />
            <Cell label="AMOUNT" value={`$${displayOrder.amount}`} />
            <Cell label="SCHEDULED" value={displayOrder.scheduledAt} />
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionLabel}>ROUTE</Text>
          <View style={styles.routeStep}>
            <View style={[styles.dot, { backgroundColor: colors.text }]} />
            <View style={{ flex: 1 }}>
              <Text style={styles.routeTitle}>Pickup</Text>
              <Text style={styles.routeAddress}>{displayOrder.pickup}</Text>
            </View>
          </View>
          <View style={styles.routeConnector} />
          <View style={styles.routeStep}>
            <View style={[styles.dot, { backgroundColor: colors.accent }]} />
            <View style={{ flex: 1 }}>
              <Text style={styles.routeTitle}>Dropoff</Text>
              <Text style={styles.routeAddress}>{displayOrder.dropoff}</Text>
            </View>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionLabel}>ASSIGNMENT</Text>
          <View style={styles.assignRow}>
            <View style={styles.itemIcon}>
              <Ionicons name="person-outline" size={14} color={colors.text} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>Driver</Text>
              <Text style={styles.sub}>{displayOrder.driverId || "Unassigned"}</Text>
            </View>
          </View>
          <View style={styles.divider} />
          <View style={styles.assignRow}>
            <View style={styles.itemIcon}>
              <Ionicons name="car-sport-outline" size={14} color={colors.text} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>Vehicle</Text>
              <Text style={styles.sub}>{displayOrder.vehicleId || "Unassigned"}</Text>
            </View>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionLabel}>ITEMS ({displayOrder.items.length})</Text>
          {displayOrder.items.map((it, i) => (
            <View key={i} style={[styles.itemRow, i > 0 && { borderTopWidth: 1, borderTopColor: colors.border }]}>
              <View style={styles.itemIcon}>
                <Ionicons name="cube-outline" size={14} color={colors.text} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.itemName}>{it.name}</Text>
                <Text style={styles.itemMeta}>
                  Qty {it.qty} · {it.weight}
                </Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionLabel}>TIMELINE</Text>
          {displayOrder.timeline.map((t, i) => (
            <View key={i} style={styles.timelineRow}>
              <View style={styles.timelineLeft}>
                <View style={[styles.timelineDot, t.done ? styles.timelineDotDone : null]}>
                  {t.done ? <Ionicons name="checkmark" size={10} color="#fff" /> : null}
                </View>
                {i < displayOrder.timeline.length - 1 ? (
                  <View style={[styles.timelineLine, t.done && styles.timelineLineDone]} />
                ) : null}
              </View>
              <View style={styles.timelineBody}>
                <Text style={[styles.timelineLabel, !t.done && { color: colors.textMuted }]}>{t.label}</Text>
                <Text style={styles.timelineTime}>{t.time}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.actionRow}>
          <TouchableOpacity
            style={styles.secondaryBtn}
            testID="start-trip-btn"
            onPress={() => runWorkflowAction("start")}
            disabled={!canStart || workflowBusy || !hasWorkflowPermission}
          >
            <Text style={styles.secondaryBtnText}>Start trip</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.primaryBtn}
            testID="advance-activity-btn"
            onPress={() => runWorkflowAction("advance")}
            disabled={!canAdvance || workflowBusy || !hasWorkflowPermission}
          >
            <Ionicons name="play-forward" size={14} color="#fff" />
            <Text style={styles.primaryBtnText}>
              {nextActivity?.name ? `Advance: ${nextActivity.name}` : "Advance activity"}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.actionRow}>
          <TouchableOpacity
            style={styles.secondaryBtn}
            testID="track-order-btn"
            onPress={() => router.push("/(tabs)/tracking")}
          >
            <Text style={styles.secondaryBtnText}>Track live</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.primaryBtn}
            testID="complete-order-btn"
            onPress={() => runWorkflowAction("complete")}
            disabled={!canComplete || workflowBusy || !hasWorkflowPermission}
          >
            <Ionicons name="checkmark-circle" size={14} color="#fff" />
            <Text style={styles.primaryBtnText}>Complete</Text>
          </TouchableOpacity>
        </View>

        {workflowBusy ? (
          <View style={styles.workflowState}>
            <ActivityIndicator color={colors.text} />
            <Text style={styles.workflowText}>Syncing workflow action...</Text>
          </View>
        ) : null}
        {workflowDisabledReason ? <Text style={styles.workflowText}>{workflowDisabledReason}</Text> : null}
        {workflowError ? <Text style={styles.workflowError}>{workflowError}</Text> : null}

        <View style={styles.card}>
          <Text style={styles.sectionLabel}>PROOF OF DELIVERY</Text>
          <SignatureCapture
            uploadState={podUploadState}
            onCapture={(value) => {
              void uploadPod("signature", value);
            }}
          />
          <PhotoCapture
            uploadState={podUploadState}
            onCapture={(value) => {
              void uploadPod("photo", value);
            }}
          />
          <QRScanner
            uploadState={podUploadState}
            onCapture={(value) => {
              void uploadPod("qr", value);
            }}
          />
          {podStatus ? <Text style={styles.workflowText}>{podStatus}</Text> : null}
        </View>

        <View style={{ height: spacing.xxxl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function Cell({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metaCell}>
      <Text style={styles.metaLabel}>{label}</Text>
      <Text style={styles.metaValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: spacing.lg, gap: spacing.md },
  empty: { padding: spacing.xxxl, alignItems: "center" },
  emptyText: { color: colors.textMuted },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
  },
  rowBetween: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  sectionLabel: {
    fontSize: 10,
    fontWeight: "800",
    color: colors.textMuted,
    letterSpacing: 1.6,
    marginBottom: spacing.md,
  },
  metaGrid: {
    flexDirection: "row",
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  metaCell: { flex: 1 },
  metaLabel: { fontSize: 9, fontWeight: "800", color: colors.textMuted, letterSpacing: 1 },
  metaValue: { fontSize: 13, fontWeight: "800", color: colors.text, marginTop: 4 },
  routeStep: { flexDirection: "row", alignItems: "center" },
  dot: { width: 10, height: 10, borderRadius: 5, marginRight: spacing.md },
  routeTitle: { fontSize: 13, fontWeight: "700", color: colors.text },
  routeAddress: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  routeConnector: {
    width: 1,
    height: 18,
    backgroundColor: colors.borderStrong,
    marginLeft: 4,
    marginVertical: 4,
  },
  assignRow: { flexDirection: "row", alignItems: "center" },
  name: { fontSize: 14, fontWeight: "800", color: colors.text },
  sub: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: spacing.md },
  itemRow: { flexDirection: "row", alignItems: "center", paddingVertical: spacing.md },
  itemIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: colors.surfaceAlt,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.md,
  },
  itemName: { fontSize: 13, fontWeight: "700", color: colors.text },
  itemMeta: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
  timelineRow: { flexDirection: "row", paddingVertical: 4 },
  timelineLeft: { width: 24, alignItems: "center" },
  timelineDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: colors.borderStrong,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  timelineDotDone: { backgroundColor: colors.success, borderColor: colors.success },
  timelineLine: { width: 2, flex: 1, backgroundColor: colors.borderStrong, marginTop: 2, minHeight: 18 },
  timelineLineDone: { backgroundColor: colors.success },
  timelineBody: { flex: 1, paddingBottom: spacing.md, marginLeft: 4 },
  timelineLabel: { fontSize: 13, fontWeight: "700", color: colors.text },
  timelineTime: { fontSize: 11, color: colors.textMuted, marginTop: 2, fontWeight: "600" },
  actionRow: { flexDirection: "row", gap: spacing.sm },
  secondaryBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    height: 46,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface,
  },
  secondaryBtnText: { color: colors.text, fontWeight: "700", fontSize: 13 },
  primaryBtn: {
    flex: 1,
    backgroundColor: colors.brand,
    borderRadius: radius.md,
    height: 46,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  primaryBtnText: { color: "#fff", fontWeight: "700", fontSize: 13 },
  workflowState: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: spacing.md },
  workflowText: { color: colors.textSecondary, fontSize: 12, fontWeight: "600" },
  workflowError: { color: colors.error, marginTop: spacing.sm, fontSize: 12, fontWeight: "600" },
});

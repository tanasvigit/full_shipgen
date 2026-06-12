import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import ScreenHeader from "@/src/components/ScreenHeader";
import StatusBadge from "@/src/components/StatusBadge";
import TripMap from "@/src/maps/tripMap";
import { tripMarkersFromOrder, listTripMapMarkers } from "@/src/maps/coordinates";
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
import { useOrderEtaQuery, useOrderTrackerQuery } from "@/src/hooks/useOrderTrackerQuery";
import { useOrderGeofenceEventsQuery } from "@/src/hooks/useOrderGeofenceEventsQuery";
import { useNextActivityQuery } from "@/src/hooks/useNextActivityQuery";
import { usePermissions } from "@/src/hooks/usePermissions";
import {
  useAdvanceActivityMutation,
  useCompleteOrderMutation,
  useStartTripMutation,
} from "@/src/hooks/mutations/useWorkflowMutations";
import { usePodMutation } from "@/src/hooks/mutations/usePodMutation";
import { canCompleteOrder, canStartTrip, isTerminalStatus, isTripInProgress } from "@/src/lib/orderStatus";
import { isDriverUser } from "@/src/lib/driver";
import type { Order } from "@/src/data/types";
import { ordersService } from "@/src/services/ordersService";
import { parseTrackerSummary, resolveDriverCoordinate, resolveOrderEtaLabel } from "@/src/lib/orderTracker";
import { openMapsNavigation } from "@/src/lib/navigation";
import { useAuth } from "@/src/contexts/AuthContext";
import { useCompanyScope } from "@/src/hooks/useCompanyScope";
import { useFleetData } from "@/src/hooks/useFleetData";
import { resolveOrderMutationRef, resolveOrderTrackingRef } from "@/src/lib/orderRef";
import { confirmAction } from "@/src/lib/confirmAction";
import AssignOrderSheet from "@/src/components/AssignOrderSheet";
import { useOrderActionsMutations } from "@/src/hooks/useOrderActionsMutations";
import {
  canAssignOrder,
  canCancelOrderAction,
  canDispatchOrderAction,
  showOpsToolbar,
} from "@/src/lib/orderOps";
import { useQuery } from "@tanstack/react-query";
import { realtimeSubscriptions } from "@/src/realtime/subscriptions";
import { colors, radius, spacing } from "@/src/theme";
import * as Haptics from "expo-haptics";

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
  const { user } = useAuth();
  const { companyUuid } = useCompanyScope();
  const { findDriver, findVehicle, drivers, vehicles } = useFleetData();
  const { snapshot: syncSnapshot, retrySync } = useSyncStatus();
  const [assignOpen, setAssignOpen] = useState(false);
  const [opsError, setOpsError] = useState<string | null>(null);
  const [opsSuccess, setOpsSuccess] = useState<string | null>(null);

  const workflowBusy =
    startTripMutation.isPending || advanceMutation.isPending || completeMutation.isPending;
  const loadingOrder = orderQuery.isLoading && !order;
  const orderLoadError =
    orderQuery.error instanceof Error ? orderQuery.error.message : null;

  const optimisticOrder = useMemo(() => {
    if (!order) return null;
    if (startTripMutation.isPending) return { ...order, status: "en_route" } as Order;
    if (completeMutation.isPending) return { ...order, status: "completed" } as Order;
    return order;
  }, [completeMutation.isPending, order, startTripMutation.isPending]);

  const displayOrder = optimisticOrder || order;
  const orderTrackingRef = resolveOrderTrackingRef(displayOrder, orderRef);
  const orderMutationRef = resolveOrderMutationRef(displayOrder, orderRef);
  const opsActions = useOrderActionsMutations(orderMutationRef);
  const trackLive = Boolean(displayOrder && !isTerminalStatus(displayOrder.status));

  const trackerQuery = useOrderTrackerQuery(orderTrackingRef, trackLive);
  const etaQuery = useOrderEtaQuery(orderTrackingRef, trackLive);
  const geofenceQuery = useOrderGeofenceEventsQuery(
    displayOrder?.driverId,
    orderTrackingRef,
    trackLive && Boolean(displayOrder?.driverId)
  );

  const proofsQuery = useQuery({
    queryKey: ["orderProofs", companyUuid, displayOrder?.id],
    queryFn: () => ordersService.getProofs(String(displayOrder?.id)),
    enabled: Boolean(displayOrder?.id),
  });

  const etaLabel = useMemo(
    () => resolveOrderEtaLabel(trackerQuery.data, etaQuery.data),
    [etaQuery.data, trackerQuery.data]
  );
  const trackerSummary = useMemo(() => parseTrackerSummary(trackerQuery.data), [trackerQuery.data]);
  const geofenceEvents = geofenceQuery.data || [];

  const proofs = (proofsQuery.data as any[]) || [];

  const mapOrder = useMemo(() => {
    if (!displayOrder) return null;
    const driverCoordinate = resolveDriverCoordinate(undefined, trackerQuery.data);
    if (!driverCoordinate) return displayOrder;
    return { ...displayOrder, driverCoordinate };
  }, [displayOrder, trackerQuery.data]);

  const mapModel = useMemo(
    () => (mapOrder ? tripMarkersFromOrder(mapOrder) : null),
    [mapOrder]
  );

  const assignmentLabels = useMemo(() => {
    if (!displayOrder) {
      return { driver: "Unassigned", vehicle: "Not assigned" };
    }
    const driverRecord = findDriver(displayOrder.driverId);
    const vehicleRecord =
      findVehicle(displayOrder.vehicleId) ||
      (driverRecord?.vehicleId ? findVehicle(driverRecord.vehicleId) : undefined);
    const driver =
      displayOrder.driverName ||
      driverRecord?.name ||
      user?.name ||
      displayOrder.driverId ||
      "Unassigned";
    const vehicle =
      displayOrder.vehicleLabel ||
      (vehicleRecord ? [vehicleRecord.plate, vehicleRecord.model].filter((v) => v && v !== "—").join(" · ") : "") ||
      "Not assigned";
    return { driver, vehicle };
  }, [displayOrder, findDriver, findVehicle, user?.name]);

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

  useEffect(() => {
    if (!opsSuccess) return;
    const timer = setTimeout(() => setOpsSuccess(null), 4000);
    return () => clearTimeout(timer);
  }, [opsSuccess]);

  const runOpsAction = async (
    label: string,
    action: () => Promise<unknown>,
    options?: { confirmTitle?: string; confirmMessage?: string; confirmLabel?: string; destructive?: boolean }
  ) => {
    if (options?.confirmTitle) {
      const confirmed = await confirmAction(options.confirmTitle, options.confirmMessage || "", {
        confirmLabel: options.confirmLabel,
        destructive: options.destructive,
      });
      if (!confirmed) return;
    }
    try {
      setOpsError(null);
      await action();
      setOpsSuccess(label);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      setOpsError(error instanceof Error ? error.message : `${label} failed`);
    }
  };

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
          <Text style={styles.emptyText}>
            {orderLoadError ? "Unable to load order details." : "Order not found."}
          </Text>
          {orderLoadError ? (
            <TouchableOpacity style={styles.retryBtn} onPress={() => void orderQuery.refetch()}>
              <Text style={styles.retryBtnText}>Retry</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </SafeAreaView>
    );
  }

  const canStart = canStartTrip(displayOrder);
  const canAdvance = Boolean(nextActivity?.code) && !isTerminalStatus(displayOrder.status);
  const canComplete = canCompleteOrder(displayOrder.status);
  const driverMode = isDriverUser(user);
  const showOps = displayOrder ? showOpsToolbar(displayOrder, permissions, driverMode) : false;
  const canAssign = displayOrder ? canAssignOrder(displayOrder, permissions, driverMode) : false;
  const canDispatch = displayOrder ? canDispatchOrderAction(displayOrder, permissions, driverMode) : false;
  const canCancel = displayOrder ? canCancelOrderAction(displayOrder, permissions, driverMode) : false;
  const hasWorkflowPermission =
    permissions.canUpdateOrder || permissions.canDispatchOrder || driverMode;
  const startDisabledReason = !hasWorkflowPermission
    ? permissions.permissionReason("update", "order")
    : displayOrder.started
      ? "Trip already started — use Advance activity."
      : !canStart
        ? "Order must be dispatched before starting a trip."
        : null;
  const workflowDisabledReason =
    startDisabledReason ||
    (!canAdvance && !canComplete && !canStart
      ? "No workflow actions available for this order state."
      : null);

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScreenHeader title={displayOrder.code} subtitle={displayOrder.customer} back />
      <SyncBanner snapshot={syncSnapshot} onRetry={retrySync} compact />
      <ScrollView contentContainerStyle={styles.scroll}>
        {mapModel ? (
          <TripMap
            height={200}
            markers={listTripMapMarkers(mapModel)}
            route={mapModel.route}
            activeMarkerId={mapModel.driver ? "driver" : undefined}
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
          {etaLabel ? (
            <View style={[styles.metaGrid, { marginTop: spacing.sm, paddingTop: spacing.sm }]}>
              <Cell label="ETA" value={etaLabel} />
              {trackerSummary.progressPercent != null ? (
                <Cell label="PROGRESS" value={`${Math.round(trackerSummary.progressPercent)}%`} />
              ) : null}
            </View>
          ) : null}
          {trackerSummary.estimatedCompletion ? (
            <Text style={styles.trackerHint}>Est. completion {trackerSummary.estimatedCompletion}</Text>
          ) : null}
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
              <Text style={styles.sub}>{assignmentLabels.driver}</Text>
            </View>
          </View>
          <View style={styles.divider} />
          <View style={styles.assignRow}>
            <View style={styles.itemIcon}>
              <Ionicons name="car-sport-outline" size={14} color={colors.text} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>Vehicle</Text>
              <Text style={styles.sub}>{assignmentLabels.vehicle}</Text>
            </View>
          </View>
        </View>

        {showOps ? (
          <View style={styles.card}>
            <Text style={styles.sectionLabel}>DISPATCH ACTIONS</Text>
            <View style={styles.actionRow}>
              {canAssign ? (
                <TouchableOpacity
                  style={styles.secondaryBtn}
                  testID="assign-order-btn"
                  disabled={opsActions.busy}
                  onPress={() => setAssignOpen(true)}
                >
                  <Text style={styles.secondaryBtnText}>Assign</Text>
                </TouchableOpacity>
              ) : null}
              {canDispatch ? (
                <TouchableOpacity
                  style={styles.primaryBtn}
                  testID="dispatch-order-btn"
                  disabled={opsActions.busy}
                  onPress={() =>
                    void runOpsAction("Order dispatched", () => opsActions.dispatchMutation.mutateAsync(), {
                      confirmTitle: "Dispatch order?",
                      confirmMessage: "The assigned driver will be notified to start the trip.",
                      confirmLabel: "Dispatch",
                    })
                  }
                >
                  <Ionicons name="paper-plane-outline" size={14} color="#fff" />
                  <Text style={styles.primaryBtnText}>Dispatch</Text>
                </TouchableOpacity>
              ) : null}
            </View>
            {canCancel ? (
              <TouchableOpacity
                style={[styles.dangerBtn, opsActions.busy && styles.btnDisabled]}
                testID="cancel-order-btn"
                disabled={opsActions.busy}
                onPress={() =>
                  void runOpsAction("Order canceled", () => opsActions.cancelMutation.mutateAsync(), {
                    confirmTitle: "Cancel order?",
                    confirmMessage: "This cannot be undone. The order will be marked canceled.",
                    confirmLabel: "Cancel order",
                    destructive: true,
                  })
                }
              >
                <Text style={styles.dangerBtnText}>Cancel order</Text>
              </TouchableOpacity>
            ) : null}
            {opsSuccess ? <Text style={styles.opsSuccess}>{opsSuccess}</Text> : null}
            {opsError ? <Text style={styles.workflowError}>{opsError}</Text> : null}
          </View>
        ) : null}

        {geofenceEvents.length > 0 ? (
          <View style={styles.card}>
            <Text style={styles.sectionLabel}>GEOFENCE ACTIVITY</Text>
            {geofenceEvents.map((event) => (
              <View key={event.id} style={styles.geofenceRow}>
                <Ionicons name="radio-outline" size={14} color={colors.text} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.geofenceLabel}>{event.label}</Text>
                  <Text style={styles.geofenceTime}>{event.occurredAt}</Text>
                </View>
              </View>
            ))}
          </View>
        ) : null}

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
            style={[styles.secondaryBtn, (!canStart || workflowBusy || !hasWorkflowPermission) && styles.btnDisabled]}
            testID="start-trip-btn"
            onPress={() => {
              if (workflowBusy) return;
              if (!hasWorkflowPermission) {
                setWorkflowError(permissions.permissionReason("update", "order") || "Missing workflow permission.");
                return;
              }
              if (displayOrder.started) {
                setWorkflowError("Trip already started — use Advance activity.");
                return;
              }
              if (!canStart) {
                setWorkflowError("Order must be dispatched before starting a trip.");
                return;
              }
              void runWorkflowAction("start");
            }}
          >
            <Text style={styles.secondaryBtnText}>Start trip</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.primaryBtn, (!canAdvance || workflowBusy || !hasWorkflowPermission) && styles.btnDisabled]}
            testID="advance-activity-btn"
            onPress={() => {
              if (workflowBusy) return;
              if (!hasWorkflowPermission) {
                setWorkflowError(permissions.permissionReason("update", "order") || "Missing workflow permission.");
                return;
              }
              if (!canAdvance) {
                setWorkflowError("No next activity is available yet. Pull to refresh or wait for dispatch.");
                return;
              }
              void runWorkflowAction("advance");
            }}
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
            testID="navigate-order-btn"
            onPress={() => {
              const enRoute = isTripInProgress(displayOrder.status);
              const target = enRoute ? displayOrder.dropoffCoordinate : displayOrder.pickupCoordinate;
              if (!target) return;
              void openMapsNavigation({
                latitude: target.latitude,
                longitude: target.longitude,
                label: enRoute ? "Dropoff" : "Pickup",
              });
            }}
            disabled={!displayOrder.pickupCoordinate && !displayOrder.dropoffCoordinate}
          >
            <Text style={styles.secondaryBtnText}>Navigate</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.secondaryBtn}
            testID="track-order-btn"
            onPress={() =>
              router.push({
                pathname: "/(tabs)/tracking",
                params: { orderId: displayOrder.id },
              })
            }
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

        {proofs.length > 0 ? (
          <View style={styles.card}>
            <Text style={styles.sectionLabel}>CAPTURED PROOFS ({proofs.length})</Text>
            {proofs.map((proof: any, index: number) => (
              <View key={String(proof.uuid || proof.id || index)} style={styles.proofRow}>
                <Ionicons name="document-text-outline" size={14} color={colors.text} />
                <Text style={styles.proofText}>
                  {(proof.type || proof.proof_type || "proof").toString()} ·{" "}
                  {proof.created_at || proof.captured_at || "saved"}
                </Text>
              </View>
            ))}
          </View>
        ) : null}

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

      <AssignOrderSheet
        visible={assignOpen}
        drivers={drivers}
        vehicles={vehicles}
        initialDriverId={displayOrder.driverId}
        initialVehicleId={displayOrder.vehicleId}
        loading={opsActions.assignMutation.isPending}
        onClose={() => setAssignOpen(false)}
        onSubmit={(input) => {
          void runOpsAction("Driver assigned", async () => {
            await opsActions.assignMutation.mutateAsync(input);
            setAssignOpen(false);
          });
        }}
      />
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
  emptyText: { color: colors.textMuted, textAlign: "center" },
  retryBtn: {
    marginTop: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.brand,
  },
  retryBtnText: { color: "#fff", fontWeight: "700", fontSize: 13 },
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
  trackerHint: { marginTop: spacing.sm, fontSize: 11, color: colors.textSecondary, fontWeight: "600" },
  geofenceRow: { flexDirection: "row", alignItems: "flex-start", gap: 8, paddingVertical: 6 },
  geofenceLabel: { fontSize: 12, fontWeight: "700", color: colors.text },
  geofenceTime: { fontSize: 11, color: colors.textMuted, marginTop: 2, fontWeight: "600" },
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
  btnDisabled: { opacity: 0.45 },
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
  dangerBtn: {
    marginTop: spacing.sm,
    borderWidth: 1,
    borderColor: colors.error,
    borderRadius: radius.md,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.errorBg,
  },
  dangerBtnText: { color: colors.error, fontWeight: "800", fontSize: 13 },
  workflowState: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: spacing.md },
  workflowText: { color: colors.textSecondary, fontSize: 12, fontWeight: "600" },
  workflowError: { color: colors.error, marginTop: spacing.sm, fontSize: 12, fontWeight: "600" },
  opsSuccess: { color: colors.success, marginTop: spacing.sm, fontSize: 12, fontWeight: "700" },
  proofRow: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 6 },
  proofText: { fontSize: 12, color: colors.textSecondary, fontWeight: "600" },
});

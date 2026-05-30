import { useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { colors, radius, spacing } from "@/src/theme";
import TripMap from "@/src/maps/tripMap";
import { tripMarkersFromOrder } from "@/src/maps/coordinates";
import { SyncBanner } from "@/src/sync/indicators";
import { useSyncStatus } from "@/src/hooks/useSyncStatus";
import StatusBadge from "@/src/components/StatusBadge";
import { useDriverOrders } from "@/src/hooks/useDriverOrders";
import { useTrackingEngine } from "@/src/hooks/useTrackingEngine";
import { matchesDriverBucket } from "@/src/lib/orderStatus";

export default function Tracking() {
  const router = useRouter();
  const { orders } = useDriverOrders();
  const activeOrders = orders.filter((o) => matchesDriverBucket(o.status, "active"));
  const [selected, setSelected] = useState<string | undefined>(undefined);
  const selectedOrder = activeOrders.find((o) => o.id === selected) ?? activeOrders[0];
  const { status: trackingStatus, syncNow } = useTrackingEngine(selectedOrder?.id, "active_trip");
  const { snapshot: syncSnapshot, retrySync } = useSyncStatus();

  const mapModel = selectedOrder ? tripMarkersFromOrder(selectedOrder) : null;
  const mapMarkers = mapModel ? [mapModel.pickup, mapModel.dropoff, mapModel.driver].filter(Boolean) : [];
  const mapRoute = mapModel?.route ?? [];

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <View>
          <Text style={styles.overline}>LIVE</Text>
          <Text style={styles.title}>Tracking</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity testID="filter-vehicles-btn" style={styles.smallBtn}>
            <Ionicons name="options-outline" size={16} color={colors.text} />
          </TouchableOpacity>
          <TouchableOpacity testID="recenter-btn" style={styles.smallBtn}>
            <Ionicons name="locate-outline" size={16} color={colors.text} />
          </TouchableOpacity>
        </View>
      </View>

      <SyncBanner snapshot={syncSnapshot} onRetry={retrySync} />
      <View style={styles.mapWrap}>
        {mapModel ? (
          <TripMap markers={mapMarkers} route={mapRoute} height={420} activeMarkerId="driver" />
        ) : (
          <View style={styles.mapPlaceholder}>
            <Ionicons name="map-outline" size={28} color={colors.textMuted} />
            <Text style={styles.mapPlaceholderText}>
              Map appears when pickup/dropoff coordinates are available from the API.
            </Text>
          </View>
        )}
        <View style={styles.mapLegend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: colors.accent }]} />
            <Text style={styles.legendText}>Selected</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: colors.text }]} />
            <Text style={styles.legendText}>Online</Text>
          </View>
        </View>
      </View>

      <View style={styles.bottomSheet}>
        <View style={styles.sheetHandle} />
        <Text style={styles.sheetLabel}>ACTIVE TRIPS · {activeOrders.length}</Text>
        <View style={styles.syncRow}>
          <Text style={styles.syncLabel}>TRACK SYNC</Text>
          <Text style={styles.syncValue}>{trackingStatus.toUpperCase()}</Text>
          <TouchableOpacity style={styles.syncBtn} onPress={syncNow} testID="tracking-sync-btn">
            <Text style={styles.syncBtnText}>Sync now</Text>
          </TouchableOpacity>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tripStrip}>
          {activeOrders.map((o) => (
            <TouchableOpacity
              key={o.id}
              testID={`trip-chip-${o.id}`}
              style={[styles.tripChip, selected === o.id && styles.tripChipActive]}
              onPress={() => setSelected(o.id)}
            >
              <Text style={[styles.tripChipText, selected === o.id && styles.tripChipTextActive]}>{o.code}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {selectedOrder ? (
          <TouchableOpacity
            style={styles.detail}
            onPress={() => router.push(`/order/${selectedOrder.id}`)}
            testID="tracking-detail-card"
          >
            <View style={styles.detailHeader}>
              <View>
                <Text style={styles.detailCode}>{selectedOrder.code}</Text>
                <Text style={styles.detailCustomer}>{selectedOrder.customer}</Text>
              </View>
              <StatusBadge status={selectedOrder.status} />
            </View>

            <View style={styles.routeBox}>
              <View style={styles.routeStep}>
                <View style={styles.routeDotA} />
                <Text style={styles.routeText} numberOfLines={1}>
                  {selectedOrder.pickup}
                </Text>
              </View>
              <View style={styles.routeConnector} />
              <View style={styles.routeStep}>
                <View style={styles.routeDotB} />
                <Text style={styles.routeText} numberOfLines={1}>
                  {selectedOrder.dropoff}
                </Text>
              </View>
            </View>

            <View style={styles.detailMeta}>
              <View style={styles.metaCell}>
                <Text style={styles.metaLabel}>DRIVER</Text>
                <Text style={styles.metaValue} numberOfLines={1}>
                  {selectedOrder.driverId || "—"}
                </Text>
              </View>
              <View style={styles.metaCell}>
                <Text style={styles.metaLabel}>VEHICLE</Text>
                <Text style={styles.metaValue}>{selectedOrder.vehicleId || "—"}</Text>
              </View>
              <View style={styles.metaCell}>
                <Text style={styles.metaLabel}>DISTANCE</Text>
                <Text style={styles.metaValue}>{selectedOrder.distance}</Text>
              </View>
            </View>
          </TouchableOpacity>
        ) : null}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  overline: { fontSize: 10, letterSpacing: 1.8, fontWeight: "700", color: colors.success },
  title: { fontSize: 22, fontWeight: "900", letterSpacing: -0.5, color: colors.text, marginTop: 2 },
  headerActions: { flexDirection: "row", gap: 8 },
  smallBtn: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  mapWrap: { paddingHorizontal: spacing.lg, marginTop: spacing.sm, position: "relative" },
  mapPlaceholder: {
    height: 420,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceAlt,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.xl,
  },
  mapPlaceholderText: {
    marginTop: spacing.sm,
    textAlign: "center",
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  mapLegend: {
    position: "absolute",
    top: spacing.md,
    left: spacing.lg + 12,
    backgroundColor: "rgba(255,255,255,0.95)",
    borderRadius: radius.sm,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  legendItem: { flexDirection: "row", alignItems: "center", marginVertical: 2 },
  legendDot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  legendText: { fontSize: 10, fontWeight: "700", color: colors.textSecondary, letterSpacing: 0.5 },
  bottomSheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.lg,
    flex: 1,
    marginTop: -16,
    borderTopWidth: 1,
    borderColor: colors.border,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.borderStrong,
    alignSelf: "center",
    marginBottom: spacing.md,
  },
  sheetLabel: { fontSize: 10, fontWeight: "800", color: colors.textMuted, letterSpacing: 1.5 },
  syncRow: { flexDirection: "row", alignItems: "center", marginTop: spacing.sm, marginBottom: spacing.xs },
  syncLabel: { fontSize: 10, color: colors.textMuted, fontWeight: "700" },
  syncValue: { marginLeft: 8, fontSize: 10, color: colors.text, fontWeight: "800" },
  syncBtn: {
    marginLeft: "auto",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  syncBtnText: { fontSize: 10, color: colors.text, fontWeight: "700" },
  tripStrip: { gap: 6, paddingVertical: 8 },
  tripChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  tripChipActive: { backgroundColor: colors.brand, borderColor: colors.brand },
  tripChipText: { fontSize: 11, fontWeight: "700", color: colors.textSecondary },
  tripChipTextActive: { color: "#fff" },
  detail: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md,
    padding: spacing.md,
    marginTop: spacing.md,
  },
  detailHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  detailCode: { fontSize: 11, fontWeight: "800", color: colors.textMuted, letterSpacing: 1 },
  detailCustomer: { fontSize: 15, fontWeight: "800", color: colors.text, marginTop: 2 },
  routeBox: { marginTop: spacing.md, paddingLeft: 4 },
  routeStep: { flexDirection: "row", alignItems: "center" },
  routeDotA: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.text, marginRight: 10 },
  routeDotB: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.accent, marginRight: 10 },
  routeConnector: { width: 1, height: 14, backgroundColor: colors.borderStrong, marginLeft: 3.5 },
  routeText: { fontSize: 12, color: colors.text, fontWeight: "500", flex: 1 },
  detailMeta: {
    flexDirection: "row",
    marginTop: spacing.md,
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.md,
  },
  metaCell: { flex: 1 },
  metaLabel: { fontSize: 9, fontWeight: "800", color: colors.textMuted, letterSpacing: 1, marginBottom: 2 },
  metaValue: { fontSize: 12, fontWeight: "700", color: colors.text },
});

import { useCallback, useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import ScreenHeader from "@/src/components/ScreenHeader";
import { colors, radius, spacing } from "@/src/theme";
import { useAuth } from "@/src/contexts/AuthContext";
import { resolveDriverTrackId } from "@/src/lib/driver";
import { scheduleService } from "@/src/services/scheduleService";

export default function DriverSchedule() {
  const { user } = useAuth();
  const driverId = resolveDriverTrackId(user);
  const [items, setItems] = useState<any[]>([]);
  const [shift, setShift] = useState<any>(null);
  const [hos, setHos] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!driverId) return;
    const [scheduleItems, activeShift, hosStatus] = await Promise.allSettled([
      scheduleService.getScheduleItems(driverId),
      scheduleService.getActiveShift(driverId),
      scheduleService.getHosStatus(driverId),
    ]);
    setItems(scheduleItems.status === "fulfilled" ? scheduleItems.value : []);
    setShift(activeShift.status === "fulfilled" ? activeShift.value : null);
    setHos(hosStatus.status === "fulfilled" ? hosStatus.value : null);
  }, [driverId]);

  useEffect(() => {
    void load().finally(() => setLoading(false));
  }, [load]);

  const refresh = async () => {
    setRefreshing(true);
    try {
      await load();
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScreenHeader title="Schedule" subtitle="Shifts & HOS" back />
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.text} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scroll}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void refresh()} />}
        >
          {!driverId ? (
            <Text style={styles.empty}>Link this user to a driver record to view schedule.</Text>
          ) : null}

          <View style={styles.card}>
            <Text style={styles.label}>ACTIVE SHIFT</Text>
            <Text style={styles.value}>
              {shift?.status || shift?.name || (shift ? JSON.stringify(shift) : "No active shift")}
            </Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.label}>HOS STATUS</Text>
            <Text style={styles.value}>
              {hos?.status || hos?.remaining_hours || (hos ? JSON.stringify(hos) : "—")}
            </Text>
          </View>

          <Text style={styles.section}>UPCOMING ITEMS</Text>
          {items.length === 0 ? (
            <Text style={styles.empty}>No scheduled items.</Text>
          ) : (
            items.map((item, index) => (
              <View key={String(item.uuid || item.id || index)} style={styles.itemCard}>
                <Text style={styles.itemTitle}>{item.title || item.type || "Shift item"}</Text>
                <Text style={styles.itemMeta}>
                  {item.start_at || item.starts_at || "—"} → {item.end_at || item.ends_at || "—"}
                </Text>
              </View>
            ))
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  scroll: { padding: spacing.lg, paddingBottom: spacing.xxxl },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  label: { fontSize: 10, fontWeight: "800", color: colors.textMuted, letterSpacing: 1.4 },
  value: { fontSize: 13, fontWeight: "700", color: colors.text, marginTop: 6 },
  section: { fontSize: 10, fontWeight: "800", color: colors.textMuted, letterSpacing: 1.6, marginBottom: spacing.sm },
  itemCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  itemTitle: { fontSize: 13, fontWeight: "800", color: colors.text },
  itemMeta: { fontSize: 11, color: colors.textSecondary, marginTop: 4, fontWeight: "600" },
  empty: { color: colors.textMuted, fontSize: 12, fontWeight: "600" },
});

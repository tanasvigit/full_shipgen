import { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import ScreenHeader from "@/src/components/ScreenHeader";
import StatusBadge from "@/src/components/StatusBadge";
import { colors, radius, spacing } from "@/src/theme";
import { manifestsService } from "@/src/services/manifestsService";

type ManifestStop = {
  public_id?: string;
  uuid?: string;
  status?: string;
  sequence?: number;
  place?: { name?: string; address?: string };
  order?: { public_id?: string };
};

export default function ManifestDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const manifestId = String(id);
  const [manifest, setManifest] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  const load = useCallback(async () => {
    const data = await manifestsService.getById(manifestId);
    setManifest(data);
  }, [manifestId]);

  useEffect(() => {
    void load().finally(() => setLoading(false));
  }, [load]);

  const completeStop = async (stop: ManifestStop) => {
    const stopId = String(stop.public_id || stop.uuid);
    if (!stopId) return;
    setUpdating(stopId);
    try {
      await manifestsService.updateStop(stopId, {
        status: "completed",
        actual_arrival: new Date().toISOString(),
      });
      await load();
    } catch (error) {
      Alert.alert("Update failed", error instanceof Error ? error.message : "Try again.");
    } finally {
      setUpdating(null);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <ScreenHeader title="Manifest" back />
        <View style={styles.center}>
          <ActivityIndicator color={colors.text} />
        </View>
      </SafeAreaView>
    );
  }

  if (!manifest) {
    return (
      <SafeAreaView style={styles.safe}>
        <ScreenHeader title="Manifest" back />
        <Text style={styles.empty}>Manifest not found.</Text>
      </SafeAreaView>
    );
  }

  const stops: ManifestStop[] = manifest.stops || [];

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScreenHeader title={manifest.public_id || manifestId} back />
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.card}>
          <View style={styles.rowBetween}>
            <Text style={styles.label}>STATUS</Text>
            <StatusBadge status={manifest.status || "pending"} />
          </View>
          <Text style={styles.meta}>Scheduled: {manifest.scheduled_date || "—"}</Text>
          <Text style={styles.meta}>Stops: {stops.length}</Text>
        </View>

        <Text style={styles.section}>STOPS</Text>
        {stops.map((stop, index) => {
          const stopId = String(stop.public_id || stop.uuid || index);
          const done = stop.status === "completed";
          return (
            <View key={stopId} style={styles.stopCard}>
              <View style={styles.stopHeader}>
                <Text style={styles.stopTitle}>
                  #{stop.sequence ?? index + 1} · {stop.place?.name || "Stop"}
                </Text>
                <StatusBadge status={(stop.status as any) || "pending"} />
              </View>
              <Text style={styles.stopAddress}>{stop.place?.address || "—"}</Text>
              {stop.order?.public_id ? (
                <TouchableOpacity onPress={() => router.push(`/order/${stop.order?.public_id}`)}>
                  <Text style={styles.orderLink}>Order {stop.order.public_id}</Text>
                </TouchableOpacity>
              ) : null}
              {!done ? (
                <TouchableOpacity
                  style={styles.completeBtn}
                  disabled={updating === stopId}
                  onPress={() => void completeStop(stop)}
                >
                  <Ionicons name="checkmark-circle-outline" size={14} color="#fff" />
                  <Text style={styles.completeBtnText}>
                    {updating === stopId ? "Updating..." : "Mark completed"}
                  </Text>
                </TouchableOpacity>
              ) : null}
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  empty: { textAlign: "center", color: colors.textMuted, marginTop: spacing.xxxl },
  scroll: { padding: spacing.lg, paddingBottom: spacing.xxxl },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  rowBetween: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  label: { fontSize: 10, fontWeight: "800", color: colors.textMuted, letterSpacing: 1.4 },
  meta: { fontSize: 12, color: colors.textSecondary, marginTop: 6, fontWeight: "600" },
  section: { fontSize: 10, fontWeight: "800", color: colors.textMuted, letterSpacing: 1.6, marginBottom: spacing.sm },
  stopCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  stopHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  stopTitle: { fontSize: 13, fontWeight: "800", color: colors.text, flex: 1, marginRight: 8 },
  stopAddress: { fontSize: 12, color: colors.textSecondary, marginTop: 4 },
  orderLink: { fontSize: 12, color: colors.brand, fontWeight: "700", marginTop: 6 },
  completeBtn: {
    marginTop: spacing.md,
    backgroundColor: colors.brand,
    borderRadius: radius.md,
    height: 40,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  completeBtnText: { color: "#fff", fontWeight: "700", fontSize: 12 },
});

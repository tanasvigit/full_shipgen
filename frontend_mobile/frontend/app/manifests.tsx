import { useCallback, useEffect, useState } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import ScreenHeader from "@/src/components/ScreenHeader";
import StatusBadge from "@/src/components/StatusBadge";
import { colors, radius, spacing } from "@/src/theme";
import { useAuth } from "@/src/contexts/AuthContext";
import { resolveDriverTrackId } from "@/src/lib/driver";
import { manifestsService } from "@/src/services/manifestsService";

type ManifestRow = {
  public_id?: string;
  uuid?: string;
  status?: string;
  scheduled_date?: string;
  stops_count?: number;
  driver?: { name?: string };
};

export default function ManifestsList() {
  const router = useRouter();
  const { user } = useAuth();
  const driverId = resolveDriverTrackId(user);
  const [rows, setRows] = useState<ManifestRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const data = await manifestsService.list({
      driver_id: driverId || undefined,
      limit: 50,
    });
    setRows((data as ManifestRow[]) || []);
  }, [driverId]);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await load();
    } finally {
      setRefreshing(false);
    }
  }, [load]);

  useEffect(() => {
    void load().finally(() => setLoading(false));
  }, [load]);

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScreenHeader title="Manifests" subtitle={driverId ? "Your routes" : "All manifests"} back />
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.text} />
        </View>
      ) : (
        <FlatList
          data={rows}
          keyExtractor={(item) => String(item.public_id || item.uuid)}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void refresh()} />}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<Text style={styles.empty}>No manifests assigned.</Text>}
          renderItem={({ item }) => {
            const id = String(item.public_id || item.uuid);
            return (
              <TouchableOpacity
                testID={`manifest-${id}`}
                style={styles.row}
                onPress={() => router.push(`/manifest/${id}`)}
              >
                <View style={styles.rowTop}>
                  <Text style={styles.code}>{id}</Text>
                  <StatusBadge status={(item.status as any) || "pending"} />
                </View>
                <View style={styles.metaRow}>
                  <View style={styles.metaItem}>
                    <Ionicons name="calendar-outline" size={11} color={colors.textMuted} />
                    <Text style={styles.metaText}>{item.scheduled_date || "—"}</Text>
                  </View>
                  <View style={styles.metaItem}>
                    <Ionicons name="flag-outline" size={11} color={colors.textMuted} />
                    <Text style={styles.metaText}>{item.stops_count ?? 0} stops</Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  list: { padding: spacing.lg, paddingBottom: spacing.xxxl },
  empty: { textAlign: "center", color: colors.textMuted, marginTop: spacing.xxxl },
  row: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  rowTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  code: { fontSize: 14, fontWeight: "800", color: colors.text },
  metaRow: { flexDirection: "row", gap: spacing.md, marginTop: spacing.sm },
  metaItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  metaText: { fontSize: 11, color: colors.textSecondary, fontWeight: "600" },
});

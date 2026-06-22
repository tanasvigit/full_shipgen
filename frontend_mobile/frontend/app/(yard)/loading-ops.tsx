import { useMemo, useState } from "react";
import { RefreshControl, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Redirect, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { colors, radius, spacing, statusColor } from "@/src/theme";
import { useYardAuth } from "@/src/contexts/YardAuthContext";
import { canAccessYardScreen } from "@/src/lib/moduleAccess";
import { useLoadingOpsBundle } from "@/src/hooks/useLoadingOpsBundle";
import { filterLoadingOpsRows } from "@/src/services/loadingOpsService";

export default function YardLoadingOpsScreen() {
  const router = useRouter();
  const { user, can, isYardAdmin } = useYardAuth();
  const { data, isLoading, isRefetching, refetch, error } = useLoadingOpsBundle();
  const [search, setSearch] = useState("");

  const allowed = canAccessYardScreen("loading-ops", can, isYardAdmin, user?.role);
  const filtered = useMemo(() => filterLoadingOpsRows(data?.rows ?? [], search), [data?.rows, search]);

  if (!allowed) return <Redirect href="/(yard)/profile" />;

  return (
    <SafeAreaView style={styles.root} edges={["top"]}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => refetch()} tintColor={colors.shipgenOrange} />}
      >
        <Text style={styles.overline}>YARD · LOADING</Text>
        <Text style={styles.title}>Loading ops</Text>
        <Text style={styles.subtitle}>Active dock sessions, progress, and open exceptions.</Text>

        {data?.summary ? (
          <View style={styles.summaryRow}>
            <Chip label="Active" value={data.summary.active} />
            <Chip label="Loading" value={data.summary.loading} />
            <Chip label="Ready" value={data.summary.ready} />
            <Chip label="Exceptions" value={data.summary.exceptions} />
          </View>
        ) : null}

        <View style={styles.searchRow}>
          <Ionicons name="search-outline" size={16} color={colors.textMuted} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search plate, dock, transporter"
            placeholderTextColor={colors.textMuted}
            style={styles.searchInput}
          />
        </View>

        {isLoading ? (
          <Text style={styles.muted}>Loading operations…</Text>
        ) : error ? (
          <Text style={styles.muted}>{error instanceof Error ? error.message : "Unable to load operations."}</Text>
        ) : filtered.length ? (
          filtered.map((row) => {
            const badge = statusColor(row.status.toLowerCase());
            return (
              <TouchableOpacity
                key={row.id}
                style={styles.card}
                onPress={() => router.push({ pathname: "/(yard)/docks", params: { q: row.dockCode } })}
              >
                <View style={styles.cardTop}>
                  <Text style={styles.plate}>{row.plate}</Text>
                  <View style={[styles.badge, { backgroundColor: badge.bg }]}>
                    <Text style={[styles.badgeText, { color: badge.fg }]}>{row.status}</Text>
                  </View>
                </View>
                <Text style={styles.meta}>Dock {row.dockCode} · {row.dockName}</Text>
                <Text style={styles.meta}>{row.transporter}</Text>
                {row.labor ? <Text style={styles.meta}>Labor · {row.labor}</Text> : null}
                {row.equipment ? <Text style={styles.meta}>Equipment · {row.equipment}</Text> : null}
                <View style={styles.progressTrack}>
                  <View style={[styles.progressFill, { width: `${row.progressPct}%` }]} />
                </View>
                <Text style={styles.progressLabel}>{row.progressPct}% estimated progress</Text>
              </TouchableOpacity>
            );
          })
        ) : (
          <Text style={styles.muted}>No active loading operations right now.</Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function Chip({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.chip}>
      <Text style={styles.chipValue}>{value}</Text>
      <Text style={styles.chipLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.xl, paddingBottom: spacing.xxxl },
  overline: { fontSize: 10, fontWeight: "700", letterSpacing: 2, color: colors.textMuted },
  title: { fontSize: 28, fontWeight: "900", color: colors.text, marginTop: 6 },
  subtitle: { fontSize: 13, color: colors.textSecondary, marginTop: 8, marginBottom: spacing.lg, lineHeight: 19 },
  summaryRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginBottom: spacing.md },
  chip: {
    minWidth: 72,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  chipValue: { fontSize: 18, fontWeight: "900", color: colors.text },
  chipLabel: { fontSize: 10, fontWeight: "700", color: colors.textMuted, marginTop: 2 },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  searchInput: { flex: 1, minHeight: 44, fontSize: 14, color: colors.text },
  muted: { fontSize: 13, color: colors.textMuted, lineHeight: 19 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.sm,
  },
  cardTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: spacing.xs },
  plate: { fontSize: 18, fontWeight: "900", color: colors.shipgenOrange },
  badge: { borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 4 },
  badgeText: { fontSize: 11, fontWeight: "800" },
  meta: { fontSize: 12, color: colors.textSecondary, marginTop: 4 },
  progressTrack: {
    height: 8,
    borderRadius: radius.pill,
    backgroundColor: colors.border,
    marginTop: spacing.md,
    overflow: "hidden",
  },
  progressFill: { height: "100%", backgroundColor: colors.shipgenOrange, borderRadius: radius.pill },
  progressLabel: { fontSize: 11, color: colors.textMuted, marginTop: 6 },
});

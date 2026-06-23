import { useMemo, useState } from "react";
import { Alert, RefreshControl, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Redirect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { colors, radius, spacing, statusColor } from "@/src/theme";
import { useYardAuth } from "@/src/contexts/YardAuthContext";
import { canAccessYardScreen } from "@/src/lib/moduleAccess";
import { useLaborBundle } from "@/src/hooks/useLaborBundle";
import { useLaborMutations } from "@/src/hooks/useLaborMutations";
import { filterLaborRows, type LaborRow } from "@/src/services/laborService";
import { laborSummaryStatus } from "@/src/lib/kpiNavigation";
import { YMS_PERMISSIONS } from "@/src/lib/ymsPermissions";
import { formatYmsAlertMessage } from "@/src/lib/ymsErrors";
import type { LaborFormInput } from "@/src/lib/laborActions";
import { canDeleteLaborRow } from "@/src/lib/laborActions";
import YardKpiStat from "@/src/components/yard/YardKpiStat";
import LaborFormSheet from "@/src/components/yard/LaborFormSheet";
import { useYardMoreBackHandler } from "@/src/components/yard/YardMoreBackHandler";

const STATUS_FILTERS = ["ALL", "ON_DUTY", "AVAILABLE", "ASSIGNED", "OFF_DUTY"] as const;

export default function YardLaborScreen() {
  useYardMoreBackHandler();
  const { user, can, isYardAdmin } = useYardAuth();
  const { data, isLoading, isRefetching, refetch, error } = useLaborBundle();
  const mutations = useLaborMutations();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<(typeof STATUS_FILTERS)[number]>("ALL");
  const [formOpen, setFormOpen] = useState(false);
  const [editingRow, setEditingRow] = useState<LaborRow | null>(null);

  const allowed = canAccessYardScreen("labor", can, isYardAdmin, user?.role);
  const canWrite = can("*") || can(YMS_PERMISSIONS.LABOR_WRITE);
  const filtered = useMemo(() => filterLaborRows(data?.rows ?? [], search, status), [data?.rows, search, status]);

  const openCreate = () => {
    setEditingRow(null);
    setFormOpen(true);
  };

  const openEdit = (row: LaborRow) => {
    setEditingRow(row);
    setFormOpen(true);
  };

  const handleSubmit = async (input: LaborFormInput) => {
    try {
      if (editingRow) {
        await mutations.updateLabor.mutateAsync({ laborId: editingRow.id, input });
        Alert.alert("Team updated", `${input.teamName.trim()} saved`);
      } else {
        await mutations.createLabor.mutateAsync(input);
        Alert.alert("Team created", "New labor team registered");
      }
      setFormOpen(false);
      setEditingRow(null);
      await refetch();
    } catch (err) {
      Alert.alert(editingRow ? "Update failed" : "Create failed", formatYmsAlertMessage(err));
    }
  };

  const handleDelete = () => {
    if (!editingRow || !canDeleteLaborRow(editingRow)) return;
    Alert.alert(
      "Delete team?",
      `Remove ${editingRow.name} (${editingRow.code})? This cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            void (async () => {
              try {
                await mutations.deleteLabor.mutateAsync(editingRow.id);
                Alert.alert("Team deleted", `${editingRow.code} removed`);
                setFormOpen(false);
                setEditingRow(null);
                await refetch();
              } catch (err) {
                Alert.alert("Delete failed", formatYmsAlertMessage(err));
              }
            })();
          },
        },
      ],
    );
  };

  if (!allowed) return <Redirect href="/(yard)/profile" />;

  return (
    <SafeAreaView style={styles.root} edges={[]}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => refetch()} tintColor={colors.shipgenOrange} />}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.titleRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.overline}>YARD · LABOR</Text>
            <Text style={styles.title}>Labor teams</Text>
            <Text style={styles.subtitle}>Shift roster, availability, and dock assignments.</Text>
          </View>
          {canWrite ? (
            <TouchableOpacity style={styles.createBtn} onPress={openCreate} testID="labor-create-open">
              <Ionicons name="add" size={18} color="#fff" />
              <Text style={styles.createBtnText}>New</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        {data?.summary ? (
          <View style={styles.summaryRow}>
            {(
              [
                ["total", "Teams", data.summary.total],
                ["onDuty", "On duty", data.summary.onDuty],
                ["available", "Available", data.summary.available],
                ["assigned", "Assigned", data.summary.assigned],
              ] as const
            ).map(([key, label, value]) => {
              const nextStatus = laborSummaryStatus(key);
              return (
                <YardKpiStat
                  key={key}
                  label={label}
                  value={value}
                  onPress={() => setStatus(nextStatus)}
                  testID={`labor-kpi-${key}`}
                  style={[styles.summaryChip, status === nextStatus && styles.summaryChipActive]}
                />
              );
            })}
          </View>
        ) : null}

        <View style={styles.searchRow}>
          <Ionicons name="search-outline" size={16} color={colors.textMuted} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search team, supervisor, location"
            placeholderTextColor={colors.textMuted}
            style={styles.searchInput}
          />
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
          {STATUS_FILTERS.map((item) => (
            <TouchableOpacity
              key={item}
              style={[styles.filterChip, status === item && styles.filterChipActive]}
              onPress={() => setStatus(item)}
            >
              <Text style={[styles.filterChipText, status === item && styles.filterChipTextActive]}>{item}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {isLoading ? (
          <Text style={styles.muted}>Loading labor teams…</Text>
        ) : error ? (
          <Text style={styles.muted}>{error instanceof Error ? error.message : "Unable to load labor."}</Text>
        ) : filtered.length ? (
          filtered.map((row) => {
            const badge = statusColor(row.status.toLowerCase());
            const CardWrapper = canWrite ? TouchableOpacity : View;
            return (
              <CardWrapper
                key={row.id}
                style={styles.card}
                onPress={canWrite ? () => openEdit(row) : undefined}
                testID={canWrite ? `labor-row-${row.code}` : undefined}
              >
                <View style={styles.cardTop}>
                  <Text style={styles.code}>{row.code}</Text>
                  <View style={styles.cardTopRight}>
                    <View style={[styles.badge, { backgroundColor: badge.bg }]}>
                      <Text style={[styles.badgeText, { color: badge.fg }]}>{row.status}</Text>
                    </View>
                    {canWrite ? <Ionicons name="chevron-forward" size={16} color={colors.textMuted} /> : null}
                  </View>
                </View>
                <Text style={styles.meta}>{row.name}</Text>
                <Text style={styles.meta}>{row.shift}</Text>
                <Text style={styles.meta}>
                  {row.available}/{row.members} available · {row.assigned}
                </Text>
                <Text style={styles.meta}>
                  {row.supervisor} · {row.location}
                </Text>
              </CardWrapper>
            );
          })
        ) : (
          <Text style={styles.muted}>No labor teams match this filter.</Text>
        )}
      </ScrollView>

      <LaborFormSheet
        visible={formOpen}
        busy={mutations.busy}
        row={editingRow}
        canDelete={editingRow ? canDeleteLaborRow(editingRow) : false}
        onClose={() => {
          setFormOpen(false);
          setEditingRow(null);
        }}
        onSubmit={(input) => {
          void handleSubmit(input);
        }}
        onDelete={canWrite && editingRow ? handleDelete : undefined}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.xl, paddingBottom: spacing.xxxl },
  titleRow: { flexDirection: "row", alignItems: "flex-start", gap: spacing.md, marginBottom: spacing.lg },
  createBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: colors.shipgenOrange,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    marginTop: spacing.lg,
  },
  createBtnText: { color: "#fff", fontWeight: "800", fontSize: 12 },
  overline: { fontSize: 10, fontWeight: "700", letterSpacing: 2, color: colors.textMuted },
  title: { fontSize: 28, fontWeight: "900", color: colors.text, marginTop: 6 },
  subtitle: { fontSize: 13, color: colors.textSecondary, marginTop: 8, lineHeight: 19 },
  summaryRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginBottom: spacing.md },
  summaryChip: { minWidth: 72, flexGrow: 1 },
  summaryChipActive: { borderColor: colors.shipgenOrange },
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
  filterRow: { gap: spacing.sm, marginBottom: spacing.lg },
  filterChip: {
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    backgroundColor: colors.surface,
  },
  filterChipActive: { backgroundColor: colors.shipgenOrange, borderColor: colors.shipgenOrange },
  filterChipText: { fontSize: 12, fontWeight: "700", color: colors.textSecondary },
  filterChipTextActive: { color: "#fff" },
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
  cardTopRight: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  code: { fontSize: 18, fontWeight: "900", color: colors.shipgenOrange },
  badge: { borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 4 },
  badgeText: { fontSize: 11, fontWeight: "800" },
  meta: { fontSize: 12, color: colors.textSecondary, marginTop: 4 },
});

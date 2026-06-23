import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Redirect } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { colors, radius, spacing } from "@/src/theme";
import { useYardAuth } from "@/src/contexts/YardAuthContext";
import { useYardVehicle360 } from "@/src/contexts/YardVehicle360Context";
import { canAccessYardScreen } from "@/src/lib/moduleAccess";
import {
  SEARCH_KIND_LABELS,
  fetchGlobalSearch,
  groupSearchResults,
  searchHitVehicleId,
  type SearchHit,
} from "@/src/services/searchService";
import { YmsApiError } from "@/src/lib/ymsApi";

export default function YardSearchScreen() {
  const { can, isYardAdmin, user } = useYardAuth();
  const { openVehicle360 } = useYardVehicle360();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchHit[]>([]);
  const [unavailable, setUnavailable] = useState<{ kind: string; reason: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const allowed = canAccessYardScreen("search", can, isYardAdmin, user?.role);

  const grouped = useMemo(() => groupSearchResults(results), [results]);

  const runSearch = useCallback(async () => {
    const trimmed = query.trim();
    if (!trimmed) return;
    setLoading(true);
    setError(null);
    try {
      const payload = await fetchGlobalSearch(trimmed);
      setResults(payload.results);
      setUnavailable(payload.unavailable);
    } catch (err) {
      setResults([]);
      setUnavailable([]);
      setError(err instanceof YmsApiError ? err.message : "Search failed.");
    } finally {
      setLoading(false);
    }
  }, [query]);

  const handleHitPress = useCallback(
    (hit: SearchHit) => {
      const vehicleId = searchHitVehicleId(hit);
      if (vehicleId) {
        openVehicle360({ vehicleId, query: hit.label });
        return;
      }
      if (hit.kind === "dock") {
        openVehicle360({ query: hit.label });
      }
    },
    [openVehicle360],
  );

  if (!allowed) {
    return <Redirect href="/(yard)/profile" />;
  }

  return (
    <SafeAreaView style={styles.root} edges={[]}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.overline}>YARD · SEARCH</Text>
        <Text style={styles.title}>Find anything</Text>
        <Text style={styles.subtitle}>Plate, booking reference, dock code, queue number, transporter.</Text>

        <View style={styles.searchRow}>
          <Ionicons name="search-outline" size={16} color={colors.textMuted} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search yard…"
            placeholderTextColor={colors.textMuted}
            style={styles.searchInput}
            returnKeyType="search"
            onSubmitEditing={() => void runSearch()}
            testID="yard-search-input"
          />
          <TouchableOpacity style={styles.searchBtn} onPress={() => void runSearch()} testID="yard-search-submit">
            <Text style={styles.searchBtnText}>{loading ? "…" : "Go"}</Text>
          </TouchableOpacity>
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        {Array.from(grouped.entries()).map(([kind, hits]) => (
          <View key={kind} style={styles.section}>
            <Text style={styles.sectionTitle}>{SEARCH_KIND_LABELS[kind] || kind}</Text>
            {hits.map((hit) => (
              <TouchableOpacity
                key={`${kind}-${hit.id}`}
                style={styles.hitRow}
                onPress={() => handleHitPress(hit)}
                testID={`search-hit-${kind}-${hit.id}`}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.hitLabel}>{hit.label}</Text>
                  <Text style={styles.hitSub}>{hit.sub}</Text>
                </View>
                {hit.meta ? <Text style={styles.hitMeta}>{hit.meta}</Text> : null}
                <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
              </TouchableOpacity>
            ))}
          </View>
        ))}

        {!loading && query.trim() && !results.length && !error ? (
          <Text style={styles.muted}>No matches for “{query.trim()}”.</Text>
        ) : null}

        {unavailable.length ? (
          <View style={styles.unavailableBox}>
            <Text style={styles.sectionTitle}>Unavailable sources</Text>
            {unavailable.map((item) => (
              <Text key={item.kind} style={styles.muted}>
                {item.kind}: {item.reason}
              </Text>
            ))}
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.xl, paddingBottom: spacing.xxxl },
  overline: { fontSize: 10, fontWeight: "700", letterSpacing: 2, color: colors.textMuted },
  title: { fontSize: 28, fontWeight: "900", color: colors.text, marginTop: 6 },
  subtitle: { fontSize: 13, color: colors.textSecondary, marginTop: 8, marginBottom: spacing.lg, lineHeight: 19 },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.lg,
  },
  searchInput: { flex: 1, minHeight: 44, fontSize: 14, color: colors.text },
  searchBtn: {
    backgroundColor: colors.shipgenOrange,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
  },
  searchBtnText: { color: "#fff", fontWeight: "800", fontSize: 12 },
  error: { color: colors.error, marginBottom: spacing.md, fontSize: 13 },
  section: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  sectionTitle: { fontSize: 12, fontWeight: "800", color: colors.textMuted, marginBottom: spacing.sm, letterSpacing: 1 },
  hitRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  hitLabel: { fontSize: 14, fontWeight: "800", color: colors.text },
  hitSub: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  hitMeta: { fontSize: 10, fontWeight: "700", color: colors.textMuted },
  muted: { fontSize: 13, color: colors.textMuted, lineHeight: 19 },
  unavailableBox: { marginTop: spacing.sm },
});

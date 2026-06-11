import { useMemo } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams } from "expo-router";
import ScreenHeader from "@/src/components/ScreenHeader";
import TripMap from "@/src/maps/tripMap";
import { usePlaceCoordinateQuery, usePlaceQuery } from "@/src/hooks/usePlaceQuery";
import { openMapsNavigation } from "@/src/lib/navigation";
import { colors, radius, spacing } from "@/src/theme";

export default function PlaceDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const placeRef = String(id);
  const placeQuery = usePlaceQuery(placeRef);
  const place = placeQuery.data ?? null;
  const coordinateQuery = usePlaceCoordinateQuery(place);
  const coordinate = place?.coordinate || coordinateQuery.data || null;

  const mapMarkers = useMemo(() => {
    if (!place || !coordinate) return [];
    return [
      {
        id: "place",
        coordinate,
        title: place.name,
        description: place.address,
        kind: "waypoint" as const,
      },
    ];
  }, [coordinate, place]);

  if (placeQuery.isLoading && !place) {
    return (
      <SafeAreaView style={styles.safe}>
        <ScreenHeader title="Place" back />
        <View style={styles.center}>
          <ActivityIndicator color={colors.text} />
        </View>
      </SafeAreaView>
    );
  }

  if (!place) {
    return (
      <SafeAreaView style={styles.safe}>
        <ScreenHeader title="Place" back />
        <View style={styles.center}>
          <Text style={styles.emptyText}>Unable to load place details.</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => void placeQuery.refetch()}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScreenHeader title={place.name} subtitle={place.type} back />
      <ScrollView contentContainerStyle={styles.scroll}>
        {mapMarkers.length > 0 ? (
          <TripMap height={200} markers={mapMarkers} activeMarkerId="place" />
        ) : (
          <View style={styles.mapPlaceholder}>
            <Ionicons name="map-outline" size={28} color={colors.textMuted} />
            <Text style={styles.mapPlaceholderText}>
              {coordinateQuery.isFetching
                ? "Looking up coordinates..."
                : "No coordinates on file for this place."}
            </Text>
          </View>
        )}

        <View style={styles.card}>
          <Text style={styles.sectionLabel}>ADDRESS</Text>
          <Text style={styles.address}>{place.address}</Text>
          <Text style={styles.city}>{place.city}</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.metaRow}>
            <Meta label="TYPE" value={place.type} />
            <Meta label="ORDERS" value={String(place.ordersCount)} />
          </View>
        </View>

        {coordinate ? (
          <TouchableOpacity
            style={styles.navigateBtn}
            testID="place-navigate-btn"
            onPress={() =>
              void openMapsNavigation({
                latitude: coordinate.latitude,
                longitude: coordinate.longitude,
                label: place.name,
              })
            }
          >
            <Ionicons name="navigate-outline" size={16} color="#fff" />
            <Text style={styles.navigateText}>Open in maps</Text>
          </TouchableOpacity>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
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
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: spacing.xxxl },
  emptyText: { color: colors.textMuted, textAlign: "center", fontSize: 13 },
  retryBtn: { marginTop: spacing.md, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderRadius: radius.md, backgroundColor: colors.brand },
  retryText: { color: "#fff", fontWeight: "700", fontSize: 12 },
  mapPlaceholder: {
    height: 160,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
  },
  mapPlaceholderText: { fontSize: 12, color: colors.textMuted, fontWeight: "600", textAlign: "center", paddingHorizontal: spacing.lg },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: "800",
    color: colors.textMuted,
    letterSpacing: 1.4,
    marginBottom: spacing.sm,
  },
  address: { fontSize: 15, fontWeight: "700", color: colors.text, lineHeight: 22 },
  city: { fontSize: 12, color: colors.textSecondary, marginTop: 6, fontWeight: "600" },
  metaRow: { flexDirection: "row", gap: spacing.lg },
  metaCell: { flex: 1 },
  metaLabel: { fontSize: 10, fontWeight: "800", color: colors.textMuted, letterSpacing: 1.2 },
  metaValue: { fontSize: 16, fontWeight: "800", color: colors.text, marginTop: 4 },
  navigateBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: colors.brand,
    borderRadius: radius.md,
    height: 48,
  },
  navigateText: { color: "#fff", fontWeight: "800", fontSize: 14 },
});

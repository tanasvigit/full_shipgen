import { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import ScreenHeader from "@/src/components/ScreenHeader";
import { colors, radius, spacing } from "@/src/theme";
import { useFleetData } from "@/src/hooks/useFleetData";
import { usePermissions } from "@/src/hooks/usePermissions";
import { isDriverUser } from "@/src/lib/driver";
import { useAuth } from "@/src/contexts/AuthContext";
import { orderActionsService } from "@/src/services/orderActionsService";
import { invalidateOrderLists } from "@/src/query/invalidation";
import { ORDERS_LIST_PARAMS } from "@/src/query/keys";
import { useDefaultOrderConfigQuery } from "@/src/hooks/useDefaultOrderConfigQuery";
import type { Place } from "@/src/data/types";

function filterPlaces(places: Place[], query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return places;
  return places.filter(
    (place) =>
      place.name.toLowerCase().includes(q) ||
      place.address.toLowerCase().includes(q) ||
      place.city.toLowerCase().includes(q)
  );
}

function PlacePicker({
  label,
  places,
  selectedId,
  onSelect,
}: {
  label: string;
  places: Place[];
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  const [search, setSearch] = useState("");
  const filtered = useMemo(() => filterPlaces(places, search), [places, search]);

  return (
    <View>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.searchRow}>
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search places"
          placeholderTextColor={colors.textMuted}
          style={styles.searchInput}
        />
      </View>
      <View style={styles.pickerBox}>
        {filtered.length === 0 ? (
          <Text style={styles.pickerEmpty}>No places match your search.</Text>
        ) : (
          filtered.map((place) => (
            <TouchableOpacity
              key={place.id}
              style={[styles.pickerRow, selectedId === place.id && styles.pickerRowActive]}
              onPress={() => onSelect(place.id)}
            >
              <Text style={styles.pickerTitle}>{place.name}</Text>
              <Text style={styles.pickerMeta} numberOfLines={1}>
                {place.address}
              </Text>
            </TouchableOpacity>
          ))
        )}
      </View>
    </View>
  );
}

export default function CreateOrder() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, activeOrganization } = useAuth();
  const permissions = usePermissions();
  const { places, drivers } = useFleetData();
  const companyUuid = activeOrganization?.uuid || null;
  const driverMode = isDriverUser(user);
  const canCreate = permissions.canCreateOrder && !driverMode;
  const configQuery = useDefaultOrderConfigQuery(canCreate);

  const [customer, setCustomer] = useState("");
  const [pickupId, setPickupId] = useState("");
  const [dropoffId, setDropoffId] = useState("");
  const [driverId, setDriverId] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (driverMode || !permissions.canCreateOrder) {
    return (
      <SafeAreaView style={styles.safe}>
        <ScreenHeader title="Create order" back />
        <View style={styles.empty}>
          <Text style={styles.emptyText}>You do not have permission to create orders.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const submit = async () => {
    if (!pickupId || !dropoffId) {
      Alert.alert("Places required", "Select pickup and dropoff places.");
      return;
    }
    if (!configQuery.data?.uuid && configQuery.isError) {
      Alert.alert("Order config unavailable", "Pull to refresh or check your organization setup.");
      return;
    }
    setSubmitting(true);
    try {
      const order = await orderActionsService.create({
        pickupPlaceId: pickupId,
        dropoffPlaceId: dropoffId,
        customerLabel: customer.trim() || undefined,
        driverId: driverId || undefined,
        notes: notes.trim() || undefined,
      });
      await invalidateOrderLists(queryClient, companyUuid, ORDERS_LIST_PARAMS);
      Alert.alert("Order created", `${order.code} is ready for dispatch.`, [
        { text: "View order", onPress: () => router.replace(`/order/${order.id || order.code}`) },
      ]);
    } catch (error) {
      Alert.alert("Unable to create order", error instanceof Error ? error.message : "Try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScreenHeader title="Create order" subtitle="Minimal field order" back />
      <ScrollView contentContainerStyle={styles.scroll}>
        {configQuery.isLoading ? (
          <View style={styles.configBanner}>
            <ActivityIndicator size="small" color={colors.text} />
            <Text style={styles.configText}>Loading order configuration…</Text>
          </View>
        ) : configQuery.isError ? (
          <TouchableOpacity style={styles.configError} onPress={() => void configQuery.refetch()}>
            <Text style={styles.configErrorText}>Order config failed to load. Tap to retry.</Text>
          </TouchableOpacity>
        ) : null}

        <Text style={styles.label}>CUSTOMER / REFERENCE</Text>
        <TextInput
          style={styles.input}
          value={customer}
          onChangeText={setCustomer}
          placeholder="Customer name or reference"
          placeholderTextColor={colors.textMuted}
        />

        <PlacePicker label="PICKUP PLACE" places={places} selectedId={pickupId} onSelect={setPickupId} />
        <PlacePicker label="DROPOFF PLACE" places={places} selectedId={dropoffId} onSelect={setDropoffId} />

        <Text style={styles.label}>ASSIGN DRIVER (OPTIONAL)</Text>
        <View style={styles.pickerBox}>
          <TouchableOpacity
            style={[styles.pickerRow, !driverId && styles.pickerRowActive]}
            onPress={() => setDriverId("")}
          >
            <Text style={styles.pickerTitle}>Unassigned</Text>
          </TouchableOpacity>
          {drivers.map((driver) => (
            <TouchableOpacity
              key={driver.id}
              style={[styles.pickerRow, driverId === driver.id && styles.pickerRowActive]}
              onPress={() => setDriverId(driver.id)}
            >
              <Text style={styles.pickerTitle}>{driver.name}</Text>
              <Text style={styles.pickerMeta}>{driver.status}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>NOTES</Text>
        <TextInput
          style={[styles.input, styles.notes]}
          value={notes}
          onChangeText={setNotes}
          placeholder="Dispatch notes"
          placeholderTextColor={colors.textMuted}
          multiline
        />

        <TouchableOpacity
          style={[styles.submit, (submitting || configQuery.isLoading) && styles.submitDisabled]}
          disabled={submitting || configQuery.isLoading}
          onPress={() => void submit()}
          testID="create-order-submit"
        >
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitText}>Create order</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: spacing.lg, gap: spacing.sm },
  empty: { padding: spacing.xxxl, alignItems: "center" },
  emptyText: { color: colors.textMuted, textAlign: "center" },
  configBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  configText: { fontSize: 12, color: colors.textSecondary, fontWeight: "600" },
  configError: {
    backgroundColor: colors.errorBg,
    borderWidth: 1,
    borderColor: colors.error,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  configErrorText: { fontSize: 12, color: colors.error, fontWeight: "700" },
  label: {
    fontSize: 10,
    fontWeight: "800",
    color: colors.textMuted,
    letterSpacing: 1.4,
    marginTop: spacing.sm,
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    color: colors.text,
    fontSize: 14,
  },
  searchRow: {
    marginTop: spacing.xs,
    marginBottom: spacing.xs,
  },
  searchInput: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    color: colors.text,
    fontSize: 13,
  },
  notes: { minHeight: 88, textAlignVertical: "top" },
  pickerBox: { gap: spacing.sm, marginTop: spacing.xs },
  pickerEmpty: { fontSize: 12, color: colors.textMuted, fontWeight: "600", paddingVertical: spacing.md },
  pickerRow: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  pickerRowActive: { borderColor: colors.brand },
  pickerTitle: { fontSize: 14, fontWeight: "700", color: colors.text },
  pickerMeta: { fontSize: 11, color: colors.textSecondary, marginTop: 2 },
  submit: {
    marginTop: spacing.lg,
    backgroundColor: colors.brand,
    borderRadius: radius.md,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  submitDisabled: { opacity: 0.6 },
  submitText: { color: "#fff", fontWeight: "800", fontSize: 14 },
});

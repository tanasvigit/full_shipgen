import { useEffect, useState } from "react";
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
import { useLocalSearchParams, useRouter, Redirect } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import ScreenHeader from "@/src/components/ScreenHeader";
import { colors, radius, spacing } from "@/src/theme";
import { useAuth } from "@/src/contexts/AuthContext";
import { resolveDriverTrackId, isDriverUser } from "@/src/lib/driver";
import { fuelReportsService } from "@/src/services/fuelReportsService";
import { useFleetData } from "@/src/hooks/useFleetData";
import { invalidateFleetAggregate } from "@/src/query/invalidation";

export default function ReportFuel() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { id: editId } = useLocalSearchParams<{ id?: string }>();
  const isEdit = Boolean(editId);
  const { user, activeOrganization } = useAuth();
  const companyUuid = activeOrganization?.uuid || null;
  const driverId = resolveDriverTrackId(user);
  const { fuelLogs, sectionLoading, refresh } = useFleetData();
  const existing = editId ? fuelLogs.find((item) => item.id === editId) : undefined;

  const [odometer, setOdometer] = useState("");
  const [volume, setVolume] = useState("");
  const [amount, setAmount] = useState("");
  const [location, setLocation] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!existing) return;
    setOdometer(existing.odometer != null ? String(existing.odometer) : "");
    setVolume(existing.amount > 0 ? String(existing.amount) : "");
    setAmount(existing.cost > 0 ? String(existing.cost) : "");
    setLocation(existing.location || (existing.station.startsWith("Odometer") ? "" : existing.station));
  }, [existing?.id]);

  if (isEdit && isDriverUser(user)) {
    return <Redirect href={editId ? `/fuel/${editId}` : "/fuels"} />;
  }

  const submit = async () => {
    const odometerNum = Number(odometer);
    const volumeNum = Number(volume);
    if (!Number.isFinite(odometerNum) || !Number.isFinite(volumeNum)) {
      Alert.alert("Invalid values", "Enter valid odometer and volume readings.");
      return;
    }
    if (!isEdit && !driverId) {
      Alert.alert("Driver profile required", "Link this user to a driver record first.");
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        odometer: odometerNum,
        volume: volumeNum,
        metric_unit: existing?.metricUnit || "L",
        amount: amount ? Number(amount) : undefined,
        location: location.trim() || undefined,
      };
      if (isEdit && editId) {
        await fuelReportsService.update(editId, payload);
        await invalidateFleetAggregate(queryClient, companyUuid);
        Alert.alert("Fuel report updated", "Your changes were saved.", [
          { text: "OK", onPress: () => router.back() },
        ]);
      } else {
        await fuelReportsService.create({
          driver: driverId!,
          ...payload,
        });
        await invalidateFleetAggregate(queryClient, companyUuid);
        Alert.alert("Fuel report saved", "Entry recorded successfully.", [
          { text: "OK", onPress: () => router.back() },
        ]);
      }
    } catch (error) {
      Alert.alert("Unable to save", error instanceof Error ? error.message : "Try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (isEdit && !existing && sectionLoading.fuel) {
    return (
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <ScreenHeader title="Edit fuel report" back />
        <View style={styles.loader}>
          <ActivityIndicator color={colors.brand} />
        </View>
      </SafeAreaView>
    );
  }

  if (isEdit && !existing) {
    return (
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <ScreenHeader title="Edit fuel report" back />
        <View style={styles.loader}>
          <Text style={styles.loaderText}>Fuel report not found.</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => void refresh()}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScreenHeader title={isEdit ? "Edit fuel report" : "Fuel report"} back />
      <ScrollView contentContainerStyle={styles.scroll}>
        <Field label="ODOMETER" value={odometer} onChangeText={setOdometer} keyboardType="numeric" />
        <Field label="VOLUME (L)" value={volume} onChangeText={setVolume} keyboardType="decimal-pad" />
        <Field label="AMOUNT (₹, optional)" value={amount} onChangeText={setAmount} keyboardType="decimal-pad" />
        <Field label="LOCATION (optional)" value={location} onChangeText={setLocation} />

        <TouchableOpacity
          testID="fuel-submit-btn"
          style={styles.primaryBtn}
          onPress={() => void submit()}
          disabled={submitting}
        >
          <Text style={styles.primaryBtnText}>
            {submitting ? "Saving..." : isEdit ? "Save changes" : "Save fuel report"}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

function Field({
  label,
  value,
  onChangeText,
  keyboardType,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  keyboardType?: "numeric" | "decimal-pad";
}) {
  return (
    <View style={{ marginTop: spacing.md }}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        placeholderTextColor={colors.textMuted}
        style={styles.input}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: spacing.lg },
  loader: { flex: 1, alignItems: "center", justifyContent: "center", gap: spacing.md },
  loaderText: { color: colors.textMuted, fontWeight: "600" },
  retryBtn: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.brandSoft,
  },
  retryText: { color: colors.brand, fontWeight: "800" },
  label: { fontSize: 10, fontWeight: "800", color: colors.textMuted, letterSpacing: 1.4, marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    height: 44,
    color: colors.text,
    backgroundColor: colors.surface,
  },
  primaryBtn: {
    backgroundColor: colors.brand,
    borderRadius: radius.md,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    marginTop: spacing.xl,
  },
  primaryBtnText: { color: "#fff", fontWeight: "700" },
});

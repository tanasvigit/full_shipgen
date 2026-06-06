import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import ScreenHeader from "@/src/components/ScreenHeader";
import { colors, radius, spacing } from "@/src/theme";
import { useAuth } from "@/src/contexts/AuthContext";
import { resolveDriverTrackId } from "@/src/lib/driver";
import { fuelReportsService } from "@/src/services/fuelReportsService";

export default function ReportFuel() {
  const router = useRouter();
  const { user } = useAuth();
  const driverId = resolveDriverTrackId(user);
  const [odometer, setOdometer] = useState("");
  const [volume, setVolume] = useState("");
  const [amount, setAmount] = useState("");
  const [location, setLocation] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    if (!driverId) {
      Alert.alert("Driver profile required", "Link this user to a driver record first.");
      return;
    }
    const odometerNum = Number(odometer);
    const volumeNum = Number(volume);
    if (!Number.isFinite(odometerNum) || !Number.isFinite(volumeNum)) {
      Alert.alert("Invalid values", "Enter valid odometer and volume readings.");
      return;
    }
    setSubmitting(true);
    try {
      await fuelReportsService.create({
        driver: driverId,
        odometer: odometerNum,
        volume: volumeNum,
        metric_unit: "L",
        amount: amount ? Number(amount) : undefined,
        location: location.trim() || undefined,
      });
      Alert.alert("Fuel report saved", "Entry recorded successfully.", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (error) {
      Alert.alert("Unable to submit", error instanceof Error ? error.message : "Try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScreenHeader title="Fuel report" back />
      <ScrollView contentContainerStyle={styles.scroll}>
        <Field label="ODOMETER" value={odometer} onChangeText={setOdometer} keyboardType="numeric" />
        <Field label="VOLUME (L)" value={volume} onChangeText={setVolume} keyboardType="decimal-pad" />
        <Field label="AMOUNT (optional)" value={amount} onChangeText={setAmount} keyboardType="decimal-pad" />
        <Field label="LOCATION (optional)" value={location} onChangeText={setLocation} />

        <TouchableOpacity
          testID="fuel-submit-btn"
          style={styles.primaryBtn}
          onPress={() => void submit()}
          disabled={submitting}
        >
          <Text style={styles.primaryBtnText}>{submitting ? "Saving..." : "Save fuel report"}</Text>
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

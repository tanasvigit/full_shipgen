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
import * as Location from "expo-location";
import ScreenHeader from "@/src/components/ScreenHeader";
import { colors, radius, spacing } from "@/src/theme";
import { useAuth } from "@/src/contexts/AuthContext";
import { resolveDriverTrackId } from "@/src/lib/driver";
import { issuesService } from "@/src/services/issuesService";

export default function ReportIssue() {
  const router = useRouter();
  const { user } = useAuth();
  const driverId = resolveDriverTrackId(user);
  const [report, setReport] = useState("");
  const [location, setLocation] = useState("");
  const [priority, setPriority] = useState("medium");
  const [submitting, setSubmitting] = useState(false);

  const useCurrentLocation = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Location required", "Enable location to attach coordinates.");
      return;
    }
    const position = await Location.getCurrentPositionAsync({});
    setLocation(`${position.coords.latitude},${position.coords.longitude}`);
  };

  const submit = async () => {
    if (!driverId) {
      Alert.alert("Driver profile required", "Link this user to a driver record first.");
      return;
    }
    if (!report.trim()) {
      Alert.alert("Description required", "Describe the issue before submitting.");
      return;
    }
    setSubmitting(true);
    try {
      await issuesService.create({
        driver: driverId,
        report: report.trim(),
        location: location.trim() || "unknown",
        priority,
        type: "driver_report",
      });
      Alert.alert("Issue reported", "Your report was submitted.", [
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
      <ScreenHeader title="Report issue" back />
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.label}>DESCRIPTION</Text>
        <TextInput
          testID="issue-report-input"
          value={report}
          onChangeText={setReport}
          multiline
          placeholder="What happened?"
          placeholderTextColor={colors.textMuted}
          style={styles.textArea}
        />

        <Text style={styles.label}>LOCATION</Text>
        <View style={styles.locationRow}>
          <TextInput
            value={location}
            onChangeText={setLocation}
            placeholder="Address or coordinates"
            placeholderTextColor={colors.textMuted}
            style={[styles.input, { flex: 1 }]}
          />
          <TouchableOpacity style={styles.locBtn} onPress={() => void useCurrentLocation()}>
            <Text style={styles.locBtnText}>GPS</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.label}>PRIORITY</Text>
        <View style={styles.prioRow}>
          {(["low", "medium", "high"] as const).map((level) => (
            <TouchableOpacity
              key={level}
              style={[styles.prioChip, priority === level && styles.prioChipActive]}
              onPress={() => setPriority(level)}
            >
              <Text style={[styles.prioText, priority === level && styles.prioTextActive]}>
                {level.toUpperCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          testID="issue-submit-btn"
          style={styles.primaryBtn}
          onPress={() => void submit()}
          disabled={submitting}
        >
          <Text style={styles.primaryBtnText}>{submitting ? "Submitting..." : "Submit report"}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: spacing.lg, gap: spacing.sm },
  label: { fontSize: 10, fontWeight: "800", color: colors.textMuted, letterSpacing: 1.4, marginTop: spacing.md },
  textArea: {
    minHeight: 120,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    color: colors.text,
    backgroundColor: colors.surface,
    textAlignVertical: "top",
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    height: 44,
    color: colors.text,
    backgroundColor: colors.surface,
  },
  locationRow: { flexDirection: "row", gap: spacing.sm, alignItems: "center" },
  locBtn: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: 12,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface,
  },
  locBtnText: { fontWeight: "700", color: colors.text, fontSize: 12 },
  prioRow: { flexDirection: "row", gap: spacing.sm },
  prioChip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: colors.surface,
  },
  prioChipActive: { backgroundColor: colors.brand, borderColor: colors.brand },
  prioText: { fontSize: 11, fontWeight: "700", color: colors.text },
  prioTextActive: { color: "#fff" },
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

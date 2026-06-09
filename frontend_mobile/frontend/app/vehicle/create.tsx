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
import { useQueryClient } from "@tanstack/react-query";
import ScreenHeader from "@/src/components/ScreenHeader";
import { colors, radius, spacing } from "@/src/theme";
import { fleetService } from "@/src/services/fleetService";
import { queryKeys } from "@/src/query/keys";
import { useAuth } from "@/src/contexts/AuthContext";

const VEHICLE_TYPES = ["Truck", "Van", "Car", "Bike"] as const;

export default function CreateVehicle() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { activeOrganization } = useAuth();
  const companyUuid = activeOrganization?.uuid || null;

  const [plate, setPlate] = useState("");
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState("");
  const [vin, setVin] = useState("");
  const [type, setType] = useState<(typeof VEHICLE_TYPES)[number]>("Van");
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    if (!plate.trim()) {
      Alert.alert("Plate required", "Enter a license plate or fleet ID for this vehicle.");
      return;
    }
    setSubmitting(true);
    try {
      const vehicle = await fleetService.createVehicle({
        plate: plate.trim(),
        make: make.trim() || undefined,
        model: model.trim() || undefined,
        year: year.trim() || undefined,
        vin: vin.trim() || undefined,
        type,
      });
      await queryClient.invalidateQueries({ queryKey: queryKeys.fleet(companyUuid) });
      Alert.alert("Vehicle added", `${vehicle.plate} is now in your fleet.`, [
        { text: "OK", onPress: () => router.replace(`/vehicle/${vehicle.id}`) },
      ]);
    } catch (error) {
      Alert.alert("Unable to add vehicle", error instanceof Error ? error.message : "Try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScreenHeader title="Add vehicle" back />
      <ScrollView contentContainerStyle={styles.scroll}>
        <Field label="PLATE / FLEET ID" value={plate} onChangeText={setPlate} autoCapitalize="characters" />
        <Field label="MAKE" value={make} onChangeText={setMake} />
        <Field label="MODEL" value={model} onChangeText={setModel} />
        <Field label="YEAR" value={year} onChangeText={setYear} keyboardType="numeric" />
        <Field label="VIN (optional)" value={vin} onChangeText={setVin} autoCapitalize="characters" />

        <Text style={styles.fieldLabel}>TYPE</Text>
        <View style={styles.typeRow}>
          {VEHICLE_TYPES.map((item) => (
            <TouchableOpacity
              key={item}
              style={[styles.typeChip, type === item && styles.typeChipActive]}
              onPress={() => setType(item)}
            >
              <Text style={[styles.typeChipText, type === item && styles.typeChipTextActive]}>{item}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          testID="create-vehicle-submit"
          style={styles.primaryBtn}
          onPress={() => void submit()}
          disabled={submitting}
        >
          <Text style={styles.primaryBtnText}>{submitting ? "Saving..." : "Add vehicle"}</Text>
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
  autoCapitalize,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  keyboardType?: "default" | "numeric";
  autoCapitalize?: "none" | "characters" | "sentences" | "words";
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        placeholderTextColor={colors.textMuted}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: spacing.lg, paddingBottom: spacing.xxxl },
  field: { marginBottom: spacing.md },
  fieldLabel: {
    fontSize: 10,
    fontWeight: "800",
    color: colors.textMuted,
    letterSpacing: 1.2,
    marginBottom: 6,
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    fontSize: 14,
    color: colors.text,
    fontWeight: "600",
  },
  typeRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: spacing.lg },
  typeChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  typeChipActive: { backgroundColor: colors.brand, borderColor: colors.brand },
  typeChipText: { fontSize: 12, fontWeight: "700", color: colors.text },
  typeChipTextActive: { color: "#fff" },
  primaryBtn: {
    backgroundColor: colors.brand,
    borderRadius: radius.md,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: spacing.sm,
  },
  primaryBtnText: { color: "#fff", fontSize: 14, fontWeight: "800" },
});

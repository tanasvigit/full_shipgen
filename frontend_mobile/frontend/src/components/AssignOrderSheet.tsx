import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { useEffect, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { colors, radius, spacing } from "@/src/theme";
import type { Driver, Vehicle } from "@/src/data/types";

type Props = {
  visible: boolean;
  drivers: Driver[];
  vehicles: Vehicle[];
  initialDriverId?: string;
  initialVehicleId?: string;
  loading?: boolean;
  onClose: () => void;
  onSubmit: (input: { driverId: string; vehicleId?: string }) => void;
};

export default function AssignOrderSheet({
  visible,
  drivers,
  vehicles,
  initialDriverId,
  initialVehicleId,
  loading,
  onClose,
  onSubmit,
}: Props) {
  const [driverId, setDriverId] = useState(initialDriverId || "");
  const [vehicleId, setVehicleId] = useState(initialVehicleId || "");

  useEffect(() => {
    if (!visible) return;
    setDriverId(initialDriverId || "");
    setVehicleId(initialVehicleId || "");
  }, [visible, initialDriverId, initialVehicleId]);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.title}>Assign driver</Text>
            <TouchableOpacity onPress={onClose} testID="assign-sheet-close">
              <Ionicons name="close" size={22} color={colors.text} />
            </TouchableOpacity>
          </View>

          <Text style={styles.label}>DRIVER</Text>
          <ScrollView style={styles.list} nestedScrollEnabled>
            {drivers.map((driver) => (
              <TouchableOpacity
                key={driver.id}
                style={[styles.row, driverId === driver.id && styles.rowActive]}
                onPress={() => {
                  setDriverId(driver.id);
                  if (driver.vehicleId) setVehicleId(driver.vehicleId);
                }}
                testID={`assign-driver-${driver.id}`}
              >
                <Text style={styles.rowTitle}>{driver.name}</Text>
                <Text style={styles.rowMeta}>{driver.status}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <Text style={[styles.label, { marginTop: spacing.md }]}>VEHICLE (OPTIONAL)</Text>
          <ScrollView style={styles.listShort} nestedScrollEnabled>
            <TouchableOpacity
              style={[styles.row, !vehicleId && styles.rowActive]}
              onPress={() => setVehicleId("")}
            >
              <Text style={styles.rowTitle}>No vehicle override</Text>
            </TouchableOpacity>
            {vehicles.map((vehicle) => (
              <TouchableOpacity
                key={vehicle.id}
                style={[styles.row, vehicleId === vehicle.id && styles.rowActive]}
                onPress={() => setVehicleId(vehicle.id)}
                testID={`assign-vehicle-${vehicle.id}`}
              >
                <Text style={styles.rowTitle}>{vehicle.plate}</Text>
                <Text style={styles.rowMeta}>{vehicle.model}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <TouchableOpacity
            style={[styles.submit, (!driverId || loading) && styles.submitDisabled]}
            disabled={!driverId || loading}
            onPress={() => onSubmit({ driverId, vehicleId: vehicleId || undefined })}
            testID="assign-sheet-submit"
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitText}>Save assignment</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: spacing.lg,
    maxHeight: "85%",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  title: { fontSize: 18, fontWeight: "800", color: colors.text },
  label: {
    fontSize: 10,
    fontWeight: "800",
    color: colors.textMuted,
    letterSpacing: 1.4,
    marginBottom: spacing.sm,
  },
  list: { maxHeight: 180 },
  listShort: { maxHeight: 140 },
  row: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    backgroundColor: colors.surfaceAlt,
  },
  rowActive: { borderColor: colors.brand, backgroundColor: colors.surface },
  rowTitle: { fontSize: 14, fontWeight: "700", color: colors.text },
  rowMeta: { fontSize: 11, color: colors.textSecondary, marginTop: 2, fontWeight: "600" },
  submit: {
    marginTop: spacing.md,
    backgroundColor: colors.brand,
    borderRadius: radius.md,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  submitDisabled: { opacity: 0.5 },
  submitText: { color: "#fff", fontWeight: "800", fontSize: 14 },
});

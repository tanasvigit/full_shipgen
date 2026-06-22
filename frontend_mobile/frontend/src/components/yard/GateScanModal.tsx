import { useState } from "react";
import { Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { Ionicons } from "@expo/vector-icons";
import { colors, radius, spacing } from "@/src/theme";

type Props = {
  visible: boolean;
  busy?: boolean;
  onClose: () => void;
  onScan: (value: string) => void;
};

export default function GateScanModal({ visible, busy, onClose, onScan }: Props) {
  const [permission, requestPermission] = useCameraPermissions();
  const [lastValue, setLastValue] = useState<string | null>(null);

  const handleScan = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed || busy) return;
    setLastValue(trimmed);
    onScan(trimmed);
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.root}>
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.overline}>GATE SCAN</Text>
            <Text style={styles.title}>Scan plate or booking</Text>
          </View>
          <TouchableOpacity onPress={onClose} testID="gate-scan-close" accessibilityRole="button">
            <Ionicons name="close" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        {!permission?.granted ? (
          <View style={styles.centered}>
            <Text style={styles.muted}>Camera access is required to scan barcodes and QR codes at the gate.</Text>
            <TouchableOpacity style={styles.btn} onPress={requestPermission} testID="gate-scan-permission">
              <Text style={styles.btnText}>Enable camera</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.cameraWrap}>
            <CameraView
              style={styles.camera}
              barcodeScannerSettings={{
                barcodeTypes: ["qr", "code128", "code39", "ean13", "pdf417"],
              }}
              onBarcodeScanned={(result) => {
                if (result.data) handleScan(result.data);
              }}
            />
            <View style={styles.overlayHint}>
              <Text style={styles.hint}>Align barcode or QR within the frame</Text>
            </View>
          </View>
        )}

        {lastValue ? <Text style={styles.lastScan}>Last scan: {lastValue}</Text> : null}
        {busy ? <Text style={styles.muted}>Recording scan…</Text> : null}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg, padding: spacing.xl, paddingTop: spacing.xxxl },
  header: { flexDirection: "row", alignItems: "center", marginBottom: spacing.lg },
  overline: { fontSize: 10, fontWeight: "700", letterSpacing: 2, color: colors.textMuted },
  title: { fontSize: 22, fontWeight: "900", color: colors.text, marginTop: 4 },
  centered: { flex: 1, justifyContent: "center", gap: spacing.md },
  muted: { fontSize: 13, color: colors.textSecondary, lineHeight: 20 },
  btn: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingVertical: 14,
    alignItems: "center",
    backgroundColor: colors.surface,
  },
  btnText: { fontWeight: "800", color: colors.text },
  cameraWrap: { flex: 1, borderRadius: radius.lg, overflow: "hidden", backgroundColor: "#000" },
  camera: { flex: 1 },
  overlayHint: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    padding: spacing.lg,
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  hint: { color: "#fff", textAlign: "center", fontWeight: "700", fontSize: 13 },
  lastScan: { marginTop: spacing.md, fontSize: 12, fontWeight: "700", color: colors.text },
});

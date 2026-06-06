import { useState } from "react";
import { View, StyleSheet, TouchableOpacity, Text } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { colors, radius, spacing } from "@/src/theme";
import { UploadProgress } from "@/src/pod/ui/UploadProgress";

type QRScannerProps = {
  onCapture: (value: string) => void;
  uploadState?: "staged" | "queued" | "uploading" | "uploaded" | "failed";
};

export function QRScanner({ onCapture, uploadState }: QRScannerProps) {
  const [permission, requestPermission] = useCameraPermissions();
  const [value, setValue] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);

  if (!permission?.granted) {
    return (
      <TouchableOpacity style={styles.btn} onPress={requestPermission} accessibilityRole="button">
        <Text style={styles.btnText}>Enable camera for QR scan</Text>
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.wrap}>
      {scanning ? (
        <View style={styles.cameraWrap}>
          <CameraView
            style={styles.camera}
            barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
            onBarcodeScanned={(result) => {
              if (!result.data) return;
              setValue(result.data);
              onCapture(result.data);
              setScanning(false);
            }}
          />
        </View>
      ) : null}
      <TouchableOpacity
        style={styles.btn}
        onPress={() => setScanning((prev) => !prev)}
        accessibilityRole="button"
        accessibilityLabel="Scan QR code"
      >
        <Text style={styles.btnText}>{scanning ? "Stop scanner" : "Scan QR code"}</Text>
      </TouchableOpacity>
      {value ? <Text style={styles.value}>Scanned: {value}</Text> : null}
      {uploadState ? <UploadProgress state={uploadState} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.sm },
  cameraWrap: { height: 200, borderRadius: radius.md, overflow: "hidden" },
  camera: { flex: 1 },
  btn: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingVertical: 12,
    alignItems: "center",
    backgroundColor: colors.surface,
  },
  btnText: { fontWeight: "700", color: colors.text, fontSize: 12 },
  value: { fontSize: 11, color: colors.textSecondary, fontWeight: "600" },
});

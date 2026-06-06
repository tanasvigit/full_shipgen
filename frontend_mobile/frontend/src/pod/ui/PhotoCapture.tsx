import { useRef, useState } from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { captureError } from "@/src/services/observability";
import { colors, radius, spacing } from "@/src/theme";
import { UploadProgress } from "@/src/pod/ui/UploadProgress";

type PhotoCaptureProps = {
  onCapture: (value: string) => void;
  uploadState?: "staged" | "queued" | "uploading" | "uploaded" | "failed";
};

export function PhotoCapture({ onCapture, uploadState }: PhotoCaptureProps) {
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [uri, setUri] = useState<string | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const openCamera = async () => {
    setError(null);

    if (!permission?.granted) {
      const result = await requestPermission();
      if (!result.granted) {
        setError("Camera permission is required for proof-of-delivery photos.");
        return;
      }
    }

    setShowCamera(true);
  };

  const snapPhoto = async () => {
    if (busy) return;

    setBusy(true);
    setError(null);
    try {
      const photo = await cameraRef.current?.takePictureAsync({
        base64: true,
        quality: 0.6,
      });

      if (!photo?.base64) {
        setError("Could not encode the photo. Try again.");
        return;
      }

      setUri(photo.uri);
      onCapture(photo.base64);
      setShowCamera(false);
    } catch (cause) {
      captureError(cause, { operation: "pod.photo.capture" });
      setError("Unable to capture the photo. Try again.");
    } finally {
      setBusy(false);
    }
  };

  if (!permission?.granted) {
    return (
      <View style={styles.wrap}>
        <TouchableOpacity style={styles.btn} onPress={openCamera} accessibilityRole="button" accessibilityLabel="Enable camera">
          <Text style={styles.btnText}>Enable camera for POD photos</Text>
        </TouchableOpacity>
        {error ? <Text style={styles.error}>{error}</Text> : null}
        {uploadState ? <UploadProgress state={uploadState} /> : null}
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      {uri ? <Image source={{ uri }} style={styles.preview} accessibilityLabel="Captured photo preview" /> : null}

      {showCamera ? (
        <View style={styles.cameraWrap}>
          <CameraView ref={cameraRef} style={styles.camera} facing="back" />
          <View style={styles.cameraActions}>
            <TouchableOpacity
              style={[styles.btn, styles.captureBtn]}
              onPress={snapPhoto}
              disabled={busy}
              accessibilityRole="button"
              accessibilityLabel="Take photo"
            >
              <Text style={[styles.btnText, styles.captureBtnText]}>{busy ? "Capturing..." : "Take photo"}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.btn}
              onPress={() => setShowCamera(false)}
              disabled={busy}
              accessibilityRole="button"
              accessibilityLabel="Close camera"
            >
              <Text style={styles.btnText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <TouchableOpacity style={styles.btn} onPress={openCamera} accessibilityRole="button" accessibilityLabel="Capture photo">
          <Text style={styles.btnText}>{uri ? "Retake photo" : "Capture photo"}</Text>
        </TouchableOpacity>
      )}

      {error ? <Text style={styles.error}>{error}</Text> : null}
      {uploadState ? <UploadProgress state={uploadState} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.sm },
  preview: { width: "100%", height: 160, borderRadius: radius.md, backgroundColor: colors.surfaceAlt },
  cameraWrap: { gap: spacing.sm },
  camera: { width: "100%", height: 220, borderRadius: radius.md, overflow: "hidden" },
  cameraActions: { flexDirection: "row", gap: spacing.sm },
  btn: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingVertical: 12,
    alignItems: "center",
    backgroundColor: colors.surface,
  },
  captureBtn: { backgroundColor: colors.brand, borderColor: colors.brand },
  btnText: { fontWeight: "700", color: colors.text, fontSize: 12 },
  error: { fontSize: 11, color: colors.error, fontWeight: "600" },
  captureBtnText: { color: colors.textInverse },
});

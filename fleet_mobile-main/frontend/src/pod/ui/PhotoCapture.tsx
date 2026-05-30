import { useState } from "react";
import { View, Image, StyleSheet, TouchableOpacity, Text } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { colors, radius, spacing } from "@/src/theme";
import { UploadProgress } from "@/src/pod/ui/UploadProgress";

type PhotoCaptureProps = {
  onCapture: (uri: string) => void;
  uploadState?: "staged" | "queued" | "uploading" | "uploaded" | "failed";
};

export async function requestCameraPermission() {
  const result = await ImagePicker.requestCameraPermissionsAsync();
  return result.granted;
}

export function PhotoCapture({ onCapture, uploadState }: PhotoCaptureProps) {
  const [uri, setUri] = useState<string | null>(null);

  const capture = async () => {
    const granted = await requestCameraPermission();
    if (!granted) return;

    const result = await ImagePicker.launchCameraAsync({
      quality: 0.6,
      allowsEditing: true,
    });

    if (result.canceled || !result.assets?.[0]?.uri) return;
    setUri(result.assets[0].uri);
    onCapture(result.assets[0].uri);
  };

  return (
    <View style={styles.wrap}>
      {uri ? <Image source={{ uri }} style={styles.preview} accessibilityLabel="Captured photo preview" /> : null}
      <TouchableOpacity style={styles.btn} onPress={capture} accessibilityRole="button" accessibilityLabel="Capture photo">
        <Text style={styles.btnText}>{uri ? "Retake photo" : "Capture photo"}</Text>
      </TouchableOpacity>
      {uploadState ? <UploadProgress state={uploadState} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.sm },
  preview: { width: "100%", height: 160, borderRadius: radius.md, backgroundColor: colors.surfaceAlt },
  btn: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingVertical: 12,
    alignItems: "center",
    backgroundColor: colors.surface,
  },
  btnText: { fontWeight: "700", color: colors.text, fontSize: 12 },
});

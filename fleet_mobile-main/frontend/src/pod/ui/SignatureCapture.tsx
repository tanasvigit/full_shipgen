import { useRef, useState } from "react";
import { View, StyleSheet, TouchableOpacity, Text } from "react-native";
import SignatureCanvas from "react-native-signature-canvas";
import { colors, radius, spacing } from "@/src/theme";
import { UploadProgress } from "@/src/pod/ui/UploadProgress";

type SignatureCaptureProps = {
  onCapture: (value: string) => void;
  uploadState?: "staged" | "queued" | "uploading" | "uploaded" | "failed";
};

export function SignatureCapture({ onCapture, uploadState }: SignatureCaptureProps) {
  const ref = useRef<{ clearSignature?: () => void; readSignature?: () => void } | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  return (
    <View style={styles.wrap}>
      <View style={styles.pad} accessibilityLabel="Signature pad">
        <SignatureCanvas
          ref={ref}
          onOK={(signature: string) => {
            setPreview(signature);
            onCapture(signature);
          }}
          descriptionText="Sign here"
          clearText="Clear"
          confirmText="Save"
          webStyle={`.m-signature-pad--footer {display:flex;}`}
        />
      </View>
      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.btn}
          onPress={() => ref.current?.clearSignature?.()}
          accessibilityRole="button"
          accessibilityLabel="Clear signature"
        >
          <Text style={styles.btnText}>Clear</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.btn, styles.primary]}
          onPress={() => ref.current?.readSignature?.()}
          accessibilityRole="button"
          accessibilityLabel="Save signature"
        >
          <Text style={[styles.btnText, styles.primaryText]}>Save signature</Text>
        </TouchableOpacity>
      </View>
      {uploadState ? <UploadProgress state={uploadState} /> : null}
      {preview ? <Text style={styles.hint}>Signature staged</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.sm },
  pad: {
    height: 180,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    overflow: "hidden",
    backgroundColor: colors.surface,
  },
  actions: { flexDirection: "row", gap: spacing.sm },
  btn: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingVertical: 10,
    alignItems: "center",
    backgroundColor: colors.surface,
  },
  primary: { backgroundColor: colors.brand, borderColor: colors.brand },
  btnText: { fontWeight: "700", color: colors.text, fontSize: 12 },
  primaryText: { color: "#fff" },
  hint: { fontSize: 11, color: colors.textMuted, fontWeight: "600" },
});

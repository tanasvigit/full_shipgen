import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Redirect, useRouter } from "expo-router";
import { colors, radius, spacing } from "@/src/theme";
import { useAuth } from "@/src/contexts/AuthContext";

export default function TwoFactorScreen() {
  const router = useRouter();
  const { authReady, isAuthenticated, session, verifyTwoFactor } = useAuth();
  const [code, setCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (authReady && isAuthenticated) {
    return <Redirect href="/(tabs)/orders" />;
  }

  if (authReady && !session?.requiresTwoFactor) {
    return <Redirect href="/" />;
  }

  const handleVerify = async () => {
    if (submitting || code.trim().length < 4) return;
    setSubmitting(true);
    setErrorMessage(null);
    try {
      await verifyTwoFactor(code.trim());
      router.replace("/(tabs)/orders");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Verification failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.wrap}
      >
        <TouchableOpacity style={styles.backBtn} onPress={() => router.replace("/")}>
          <Ionicons name="arrow-back" size={18} color={colors.text} />
        </TouchableOpacity>

        <Text style={styles.overline}>SECURITY</Text>
        <Text style={styles.title}>Two-factor verification</Text>
        <Text style={styles.subtitle}>
          Enter the code sent to {session?.twoFaIdentity || "your account"}.
        </Text>

        <Text style={styles.label}>Verification code</Text>
        <View style={styles.inputRow}>
          <Ionicons name="key-outline" size={16} color={colors.textMuted} />
          <TextInput
            testID="two-fa-code-input"
            value={code}
            onChangeText={setCode}
            keyboardType="number-pad"
            autoComplete="one-time-code"
            placeholder="123456"
            placeholderTextColor={colors.textMuted}
            style={styles.input}
          />
        </View>

        <TouchableOpacity
          testID="two-fa-submit-btn"
          style={styles.primaryBtn}
          onPress={handleVerify}
          disabled={submitting}
        >
          <Text style={styles.primaryBtnText}>{submitting ? "Verifying..." : "Verify & continue"}</Text>
        </TouchableOpacity>

        {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  wrap: { flex: 1, padding: spacing.xl },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.xl,
  },
  overline: { fontSize: 10, fontWeight: "700", letterSpacing: 2, color: colors.textMuted },
  title: { fontSize: 26, fontWeight: "900", color: colors.text, marginTop: 6 },
  subtitle: { fontSize: 13, color: colors.textSecondary, marginTop: 8, marginBottom: spacing.xl },
  label: { fontSize: 11, fontWeight: "700", color: colors.textSecondary, marginBottom: 6 },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: 12,
    height: 46,
    backgroundColor: colors.surface,
  },
  input: { flex: 1, marginLeft: 8, color: colors.text, fontSize: 18, letterSpacing: 4 },
  primaryBtn: {
    backgroundColor: colors.brand,
    borderRadius: radius.md,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    marginTop: spacing.xl,
  },
  primaryBtnText: { color: "#fff", fontWeight: "700", fontSize: 14 },
  errorText: { color: colors.error, marginTop: spacing.md, fontSize: 12, fontWeight: "600" },
});

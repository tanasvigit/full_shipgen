import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ImageBackground,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Redirect, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, radius, spacing } from "@/src/theme";
import { useAuth } from "@/src/contexts/AuthContext";

export default function Login() {
  const router = useRouter();
  const { authReady, isAuthenticated, login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (authReady && isAuthenticated) {
    return <Redirect href="/(tabs)/orders" />;
  }

  const handleLogin = async () => {
    if (submitting) {
      return;
    }
    setSubmitting(true);
    setErrorMessage(null);
    try {
      await login(email.trim(), password);
      router.replace("/(tabs)/orders");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to sign in";
      setErrorMessage(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.root}>
      <ImageBackground
        source={require("@/assets/images/splash-image.png")}
        style={styles.heroBg}
        resizeMode="cover"
      >
        <View style={styles.heroOverlay} />
        <SafeAreaView edges={["top"]} style={styles.heroSafe}>
          <View style={styles.brandRow}>
            <View style={styles.logoMark}>
              <Ionicons name="navigate" size={18} color="#fff" />
            </View>
            <Text style={styles.brand}>FLEETBASE</Text>
          </View>
          <View style={{ flex: 1 }} />
          <Text style={styles.heroTitle}>Move fleets,{"\n"}not paperwork.</Text>
          <Text style={styles.heroSubtitle}>
            Operations console for dispatchers, drivers and ops managers.
          </Text>
        </SafeAreaView>
      </ImageBackground>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.formWrap}
      >
        <ScrollView
          contentContainerStyle={styles.form}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.overline}>SIGN IN</Text>
          <Text style={styles.title}>Welcome back</Text>
          <Text style={styles.subtitle}>Sign in with your Fleetbase account.</Text>

          <Text style={styles.label}>Email</Text>
          <View style={styles.inputRow}>
            <Ionicons name="mail-outline" size={16} color={colors.textMuted} />
            <TextInput
              testID="login-email-input"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              placeholder="you@company.com"
              placeholderTextColor={colors.textMuted}
              style={styles.input}
            />
          </View>

          <Text style={styles.label}>Password</Text>
          <View style={styles.inputRow}>
            <Ionicons name="lock-closed-outline" size={16} color={colors.textMuted} />
            <TextInput
              testID="login-password-input"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPwd}
              placeholder="••••••••"
              placeholderTextColor={colors.textMuted}
              style={styles.input}
            />
            <TouchableOpacity onPress={() => setShowPwd((s) => !s)} testID="toggle-password">
              <Ionicons
                name={showPwd ? "eye-off-outline" : "eye-outline"}
                size={16}
                color={colors.textMuted}
              />
            </TouchableOpacity>
          </View>

          <TouchableOpacity testID="login-submit-btn" style={styles.primaryBtn} onPress={handleLogin}>
            <Text style={styles.primaryBtnText}>{submitting ? "Signing in..." : "Sign in"}</Text>
            <Ionicons name="arrow-forward" size={16} color="#fff" />
          </TouchableOpacity>

          {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OR</Text>
            <View style={styles.dividerLine} />
          </View>

          <TouchableOpacity testID="sso-btn" style={styles.secondaryBtn} onPress={handleLogin}>
            <Ionicons name="key-outline" size={16} color={colors.text} />
            <Text style={styles.secondaryBtnText}>Continue with SSO</Text>
          </TouchableOpacity>

          <Text style={styles.footer}>
            By signing in you agree to our Terms · v1.0
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  heroBg: { height: 280 },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(10,10,10,0.65)",
  },
  heroSafe: { flex: 1, paddingHorizontal: spacing.xl, paddingBottom: spacing.xl },
  brandRow: { flexDirection: "row", alignItems: "center", marginTop: spacing.sm },
  logoMark: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  brand: { color: "#fff", fontWeight: "900", letterSpacing: 2.5, fontSize: 13 },
  heroTitle: { color: "#fff", fontSize: 30, fontWeight: "900", letterSpacing: -0.5, lineHeight: 36 },
  heroSubtitle: { color: "rgba(255,255,255,0.8)", fontSize: 13, marginTop: 8, maxWidth: 280 },
  formWrap: { flex: 1, backgroundColor: colors.surface, marginTop: -24, borderTopLeftRadius: 24, borderTopRightRadius: 24 },
  form: { padding: spacing.xl, paddingBottom: spacing.xxxl },
  overline: { fontSize: 10, fontWeight: "700", letterSpacing: 2, color: colors.textMuted, marginBottom: 6 },
  title: { fontSize: 26, fontWeight: "900", letterSpacing: -0.5, color: colors.text },
  subtitle: { fontSize: 13, color: colors.textSecondary, marginTop: 6, marginBottom: spacing.xl },
  label: { fontSize: 11, fontWeight: "700", color: colors.textSecondary, marginBottom: 6, marginTop: spacing.md },
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
  input: { flex: 1, marginLeft: 8, color: colors.text, fontSize: 14 },
  primaryBtn: {
    backgroundColor: colors.brand,
    borderRadius: radius.md,
    height: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: spacing.xl,
  },
  primaryBtnText: { color: "#fff", fontWeight: "700", marginRight: 6, fontSize: 14 },
  divider: { flexDirection: "row", alignItems: "center", marginVertical: spacing.lg },
  dividerLine: { flex: 1, height: 1, backgroundColor: colors.border },
  dividerText: { fontSize: 10, fontWeight: "700", color: colors.textMuted, marginHorizontal: 10, letterSpacing: 1.5 },
  secondaryBtn: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    height: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryBtnText: { color: colors.text, fontWeight: "700", marginLeft: 6, fontSize: 14 },
  errorText: { color: colors.error, marginTop: spacing.md, fontSize: 12, fontWeight: "600" },
  footer: { textAlign: "center", color: colors.textMuted, fontSize: 11, marginTop: spacing.xl },
});

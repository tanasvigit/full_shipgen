import { ReactNode } from "react";
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
  ImageBackground,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { colors, radius, spacing } from "@/src/theme";
import ShipgenBrand from "@/src/components/shipgen/ShipgenBrand";

type Props = {
  moduleLabel: string;
  title: string;
  subtitle: string;
  heroTitle: string;
  heroSubtitle: string;
  children: ReactNode;
};

export default function AuthLoginShell({
  moduleLabel,
  title,
  subtitle,
  heroTitle,
  heroSubtitle,
  children,
}: Props) {
  const router = useRouter();

  return (
    <View style={styles.root}>
      <ImageBackground
        source={require("@/assets/images/splash-image.png")}
        style={styles.heroBg}
        resizeMode="cover"
      >
        <View style={styles.heroOverlay} />
        <SafeAreaView edges={["top"]} style={styles.heroSafe}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.replace("/")} testID="login-back-btn">
            <Ionicons name="arrow-back" size={18} color="#fff" />
            <Text style={styles.backText}>Modules</Text>
          </TouchableOpacity>
          <ShipgenBrand subtitle={moduleLabel} compact />
          <View style={{ flex: 1 }} />
          <Text style={styles.heroTitle}>{heroTitle}</Text>
          <Text style={styles.heroSubtitle}>{heroSubtitle}</Text>
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
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>
          {children}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  heroBg: { height: 260 },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(10,14,26,0.72)",
  },
  heroSafe: { flex: 1, paddingHorizontal: spacing.xl, paddingBottom: spacing.xl },
  backBtn: { flexDirection: "row", alignItems: "center", marginTop: spacing.sm, marginBottom: spacing.lg },
  backText: { color: "#fff", marginLeft: 6, fontWeight: "700", fontSize: 13 },
  heroTitle: { color: "#fff", fontSize: 28, fontWeight: "900", letterSpacing: -0.5, lineHeight: 34 },
  heroSubtitle: { color: "rgba(255,255,255,0.82)", fontSize: 13, marginTop: 8, maxWidth: 300 },
  formWrap: {
    flex: 1,
    backgroundColor: colors.surface,
    marginTop: -24,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  form: { padding: spacing.xl, paddingBottom: spacing.xxxl },
  overline: { fontSize: 10, fontWeight: "700", letterSpacing: 2, color: colors.textMuted, marginBottom: 6 },
  title: { fontSize: 26, fontWeight: "900", letterSpacing: -0.5, color: colors.text },
  subtitle: { fontSize: 13, color: colors.textSecondary, marginTop: 6, marginBottom: spacing.xl },
});

export const loginFieldStyles = StyleSheet.create({
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
  errorText: { color: colors.error, marginTop: spacing.md, fontSize: 12, fontWeight: "600" },
  footer: { textAlign: "center", color: colors.textMuted, fontSize: 11, marginTop: spacing.xl },
  hintBox: {
    marginTop: spacing.lg,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    backgroundColor: colors.surfaceAlt,
  },
  hintTitle: { fontSize: 10, fontWeight: "700", letterSpacing: 1.5, color: colors.textMuted, marginBottom: 6 },
  hintText: { fontSize: 11, color: colors.textSecondary, lineHeight: 16 },
});

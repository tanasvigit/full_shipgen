import { useState } from "react";
import { Text, TextInput, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Redirect, useRouter } from "expo-router";
import { useAuth } from "@/src/contexts/AuthContext";
import AuthLoginShell, { loginFieldStyles as styles } from "@/src/components/auth/AuthLoginShell";
import { setActiveModule } from "@/src/lib/appModule";
import { ymsAuthService } from "@/src/services/ymsAuthService";

export default function DriverLoginScreen() {
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
    if (submitting) return;
    setSubmitting(true);
    setErrorMessage(null);
    try {
      await setActiveModule("driver");
      const result = await login(email.trim(), password);
      await ymsAuthService.clearLocalSession();
      router.replace(result.requiresTwoFactor ? "/two-fa" : "/(tabs)/orders");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to sign in");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLoginShell
      moduleLabel="Fleetops Driver"
      title="Welcome back"
      subtitle="Sign in with your Fleetops fleet account."
      heroTitle={"Move fleets,\nnot paperwork."}
      heroSubtitle="Fleetops driver experience for assigned orders, live tracking, and proof of delivery."
    >
      <Text style={styles.label}>Email</Text>
      <View style={styles.inputRow}>
        <Ionicons name="mail-outline" size={16} color="#9CA3AF" />
        <TextInput
          testID="login-email-input"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          placeholder="you@company.com"
          placeholderTextColor="#9CA3AF"
          style={styles.input}
        />
      </View>

      <Text style={styles.label}>Password</Text>
      <View style={styles.inputRow}>
        <Ionicons name="lock-closed-outline" size={16} color="#9CA3AF" />
        <TextInput
          testID="login-password-input"
          value={password}
          onChangeText={setPassword}
          secureTextEntry={!showPwd}
          placeholder="••••••••"
          placeholderTextColor="#9CA3AF"
          style={styles.input}
        />
        <TouchableOpacity onPress={() => setShowPwd((s) => !s)} testID="toggle-password">
          <Ionicons name={showPwd ? "eye-off-outline" : "eye-outline"} size={16} color="#9CA3AF" />
        </TouchableOpacity>
      </View>

      <TouchableOpacity testID="login-submit-btn" style={styles.primaryBtn} onPress={handleLogin}>
        <Text style={styles.primaryBtnText}>{submitting ? "Signing in..." : "Sign in to Fleetops"}</Text>
        <Ionicons name="arrow-forward" size={16} color="#fff" />
      </TouchableOpacity>

      {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
      <Text style={styles.footer}>Fleet drivers and dispatch users · Fleetops IAM</Text>
    </AuthLoginShell>
  );
}

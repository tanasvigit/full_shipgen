import { useState } from "react";
import { Text, TextInput, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Redirect, useRouter } from "expo-router";
import { useYardAuth } from "@/src/contexts/YardAuthContext";
import AuthLoginShell, { loginFieldStyles as styles } from "@/src/components/auth/AuthLoginShell";
import { useAuth } from "@/src/contexts/AuthContext";
import { canAccessYardTab } from "@/src/lib/moduleAccess";

const YMS_DEMO_PASSWORD = "Shipgen@Yms2026!";

const YARD_ROLE_HINTS = [
  { email: "yard.admin@shipgen.demo", password: YMS_DEMO_PASSWORD, role: "Yard Administrator" },
  { email: "yard.manager@shipgen.demo", password: YMS_DEMO_PASSWORD, role: "Yard Manager" },
  { email: "yard.gate@shipgen.demo", password: YMS_DEMO_PASSWORD, role: "Gate Operator" },
  { email: "yard.coordinator@shipgen.demo", password: YMS_DEMO_PASSWORD, role: "Yard Coordinator" },
];

function defaultYardHomeForUser(user: { role?: string | null; permissions?: string[] }) {
  const isYardAdmin = user.role === "yard_admin";
  const can = (permission: string) => {
    if (isYardAdmin || user.permissions?.includes("*")) return true;
    return Boolean(user.permissions?.includes(permission));
  };
  if (canAccessYardTab("gate", can, isYardAdmin)) return "/(yard)/gate";
  if (canAccessYardTab("queue", can, isYardAdmin)) return "/(yard)/queue";
  return "/(yard)/profile";
}

export default function YmsLoginScreen() {
  const router = useRouter();
  const { yardReady, isYardAuthenticated, login, user } = useYardAuth();
  const { logout: logoutDriver } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (yardReady && isYardAuthenticated && user) {
    return <Redirect href={defaultYardHomeForUser(user)} />;
  }

  const handleLogin = async () => {
    if (submitting) return;
    setSubmitting(true);
    setErrorMessage(null);
    try {
      const me = await login(email.trim(), password);
      await logoutDriver({ notifyServer: false });
      router.replace(defaultYardHomeForUser(me));
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Yard sign-in failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLoginShell
      moduleLabel="Yard Management (YMS)"
      title="Yard operator sign in"
      subtitle="Use your yard email and password. Same format as the Shipgen console."
      heroTitle={"Gate, queue,\ndock control."}
      heroSubtitle="Mobile workspace for gate operators, coordinators, and yard supervisors."
    >
      <Text style={styles.label}>Email</Text>
      <View style={styles.inputRow}>
        <Ionicons name="mail-outline" size={16} color="#9CA3AF" />
        <TextInput
          testID="yms-login-email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          placeholder="yard.gate@shipgen.demo"
          placeholderTextColor="#9CA3AF"
          style={styles.input}
        />
      </View>

      <Text style={styles.label}>Password</Text>
      <View style={styles.inputRow}>
        <Ionicons name="lock-closed-outline" size={16} color="#9CA3AF" />
        <TextInput
          testID="yms-login-password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry={!showPwd}
          placeholder="••••••••"
          placeholderTextColor="#9CA3AF"
          style={styles.input}
        />
        <TouchableOpacity onPress={() => setShowPwd((s) => !s)}>
          <Ionicons name={showPwd ? "eye-off-outline" : "eye-outline"} size={16} color="#9CA3AF" />
        </TouchableOpacity>
      </View>

      <TouchableOpacity testID="yms-login-submit" style={styles.primaryBtn} onPress={handleLogin}>
        <Text style={styles.primaryBtnText}>{submitting ? "Signing in..." : "Sign in to Yard"}</Text>
        <Ionicons name="arrow-forward" size={16} color="#fff" />
      </TouchableOpacity>

      {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

      {__DEV__ ? (
        <View style={styles.hintBox}>
          <Text style={styles.hintTitle}>DEV YARD ACCOUNTS</Text>
          {YARD_ROLE_HINTS.map((account) => (
            <Text key={account.email} style={styles.hintText}>
              {account.role}: {account.email} / {account.password}
            </Text>
          ))}
        </View>
      ) : null}

      <Text style={styles.footer}>Password: 8+ chars with upper, lower, number, and symbol</Text>
    </AuthLoginShell>
  );
}

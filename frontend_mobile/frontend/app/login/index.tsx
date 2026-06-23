import { useState } from "react";
import { Text, TextInput, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Redirect, useRouter } from "expo-router";
import { useAuth } from "@/src/contexts/AuthContext";
import { useYardAuth } from "@/src/contexts/YardAuthContext";
import AuthLoginShell, { loginFieldStyles as styles } from "@/src/components/auth/AuthLoginShell";
import { setActiveModule } from "@/src/lib/appModule";
import { defaultMobileHome, defaultYardHome } from "@/src/lib/moduleAccess";
import {
  isCredentialMismatchError,
  shouldTryYmsFirst,
  unifiedLoginErrorMessage,
} from "@/src/lib/unifiedLogin";
import { ymsAuthService } from "@/src/services/ymsAuthService";

const YMS_DEMO_PASSWORD = "Shipgen@Yms2026!";

const YARD_ROLE_HINTS = [
  { email: "yard.admin@shipgen.demo", password: YMS_DEMO_PASSWORD, role: "Yard Administrator" },
  { email: "yard.manager@shipgen.demo", password: YMS_DEMO_PASSWORD, role: "Yard Manager" },
  { email: "yard.gate@shipgen.demo", password: YMS_DEMO_PASSWORD, role: "Gate Operator" },
  { email: "yard.coordinator@shipgen.demo", password: YMS_DEMO_PASSWORD, role: "Yard Coordinator" },
  { email: "yard.supervisor@shipgen.demo", password: YMS_DEMO_PASSWORD, role: "Dock Supervisor" },
];

export default function UnifiedLoginScreen() {
  const router = useRouter();
  const { authReady, isAuthenticated, user, login: fleetLogin, logout: fleetLogout } = useAuth();
  const { yardReady, isYardAuthenticated, user: yardUser, login: yardLogin, logout: yardLogout } = useYardAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (authReady && yardReady && isYardAuthenticated && yardUser) {
    return <Redirect href={defaultYardHome(yardUser)} />;
  }

  if (authReady && isAuthenticated) {
    const home = defaultMobileHome(user);
    return <Redirect href={home ?? "/(tabs)/dashboard"} />;
  }

  const handleLogin = async () => {
    if (submitting) return;
    const identity = email.trim();
    if (!identity || !password) {
      setErrorMessage("Enter your email and password.");
      return;
    }

    setSubmitting(true);
    setErrorMessage(null);

    const ymsFirst = shouldTryYmsFirst(identity);
    let primaryError: unknown = null;
    let secondaryError: unknown = null;

    const tryFleet = async (quiet: boolean) => {
      await setActiveModule("driver");
      await ymsAuthService.clearLocalSession();
      await yardLogout({ notifyServer: false });
      const fleetResult = await fleetLogin(identity, password, { quiet });
      if (fleetResult.requiresTwoFactor) {
        router.replace("/two-fa");
        return true;
      }
      return true;
    };

    const tryYard = async () => {
      await fleetLogout({ notifyServer: false });
      await yardLogin(identity, password);
      await setActiveModule("yard");
      return true;
    };

    try {
      if (ymsFirst) {
        try {
          await tryYard();
          return;
        } catch (error) {
          primaryError = error;
          if (!isCredentialMismatchError(error)) {
            setErrorMessage(error instanceof Error ? error.message : "Unable to sign in to Yard.");
            return;
          }
        }

        try {
          await tryFleet(true);
          return;
        } catch (error) {
          secondaryError = error;
        }
      } else {
        try {
          await tryFleet(false);
          return;
        } catch (error) {
          primaryError = error;
          await fleetLogout({ notifyServer: false });
          if (!isCredentialMismatchError(error)) {
            setErrorMessage(error instanceof Error ? error.message : "Unable to sign in to Fleetops.");
            return;
          }
        }

        try {
          await tryYard();
          return;
        } catch (error) {
          secondaryError = error;
        }
      }

      setErrorMessage(
        unifiedLoginErrorMessage(
          ymsFirst ? secondaryError : primaryError,
          ymsFirst ? primaryError : secondaryError,
        ),
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLoginShell
      showBackButton={false}
      moduleLabel="Shipgen"
      title="Sign in"
      subtitle="Use your Fleetops or YMS credentials. We route you to the right workspace automatically."
      heroTitle={"One login.\nTwo workspaces."}
      heroSubtitle="Fleetops for drivers and fleet teams · YMS for gate, queue, and dock operations."
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

      <TouchableOpacity testID="login-submit-btn" style={styles.primaryBtn} onPress={() => void handleLogin()}>
        <Text style={styles.primaryBtnText}>{submitting ? "Signing in..." : "Sign in"}</Text>
        <Ionicons name="arrow-forward" size={16} color="#fff" />
      </TouchableOpacity>

      {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

      {__DEV__ ? (
        <View style={styles.hintBox}>
          <Text style={styles.hintTitle}>DEV YMS ACCOUNTS</Text>
          {YARD_ROLE_HINTS.map((account) => (
            <Text key={account.email} style={styles.hintText}>
              {account.role}: {account.email} / {account.password}
            </Text>
          ))}
        </View>
      ) : null}

      <Text style={styles.footer}>Fleetops · Yard Management System · Secure access</Text>
    </AuthLoginShell>
  );
}

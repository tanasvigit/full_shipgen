import "@/src/polyfills";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { StatusBar } from "expo-status-bar";
import { QueryClientProvider } from "@tanstack/react-query";
import { View, Text } from "react-native";
import * as Sentry from "@sentry/react-native";

import { useIconFonts } from "@/src/hooks/use-icon-fonts";
import { AuthProvider } from "@/src/contexts/AuthContext";
import { RuntimeProvider } from "@/src/contexts/RuntimeProvider";
import { queryClient } from "@/src/query/client";
import { initObservability } from "@/src/services/observability";
import "@/src/tracking/background/task";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useIconFonts();

  useEffect(() => {
    initObservability();
    if (loaded || error) {
      SplashScreen.hideAsync();
    }
  }, [loaded, error]);

  if (!loaded && !error) return null;

  return (
    <QueryClientProvider client={queryClient}>
      <Sentry.ErrorBoundary
        fallback={({ error }) => (
          <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 20 }}>
            <Text style={{ fontSize: 16, fontWeight: "600", marginBottom: 8 }}>Something went wrong</Text>
            <Text style={{ textAlign: "center", color: "#6B7280" }}>{error?.message || "Unexpected error"}</Text>
          </View>
        )}
      >
        <AuthProvider>
          <RuntimeProvider>
            <StatusBar style="dark" />
            <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: "#F8F9FA" } }} />
          </RuntimeProvider>
        </AuthProvider>
      </Sentry.ErrorBoundary>
    </QueryClientProvider>
  );
}

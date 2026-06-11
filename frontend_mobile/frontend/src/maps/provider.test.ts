import { afterEach, describe, expect, it, vi } from "vitest";

describe("maps provider", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("requires a native Google Maps key on Android", async () => {
    vi.doMock("expo-constants", () => ({
      default: { expoConfig: { android: { config: { googleMaps: { apiKey: "" } } } } },
    }));
    vi.doMock("react-native", () => ({ Platform: { OS: "android" } }));
    const { isNativeMapsSupported } = await import("@/src/maps/provider");
    expect(isNativeMapsSupported()).toBe(false);
  });

  it("enables native maps on Android when the native key is present", async () => {
    vi.doMock("expo-constants", () => ({
      default: { expoConfig: { android: { config: { googleMaps: { apiKey: "test-key" } } } } },
    }));
    vi.doMock("react-native", () => ({ Platform: { OS: "android" } }));
    const { isNativeMapsSupported, shouldUseGoogleMapProvider } = await import("@/src/maps/provider");
    expect(isNativeMapsSupported()).toBe(true);
    expect(shouldUseGoogleMapProvider()).toBe(true);
  });

  it("enables native maps on iOS without a Google key", async () => {
    vi.doMock("expo-constants", () => ({
      default: { expoConfig: { android: { config: { googleMaps: { apiKey: "" } } } } },
    }));
    vi.doMock("react-native", () => ({ Platform: { OS: "ios" } }));
    const { isNativeMapsSupported } = await import("@/src/maps/provider");
    expect(isNativeMapsSupported()).toBe(true);
  });

  it("flags rebuild when env key exists but native manifest key is missing", async () => {
    vi.stubEnv("EXPO_PUBLIC_GOOGLE_MAPS_API_KEY", "env-key");
    vi.doMock("expo-constants", () => ({
      default: { expoConfig: { android: { config: { googleMaps: { apiKey: "" } } } } },
    }));
    vi.doMock("react-native", () => ({ Platform: { OS: "android" } }));
    const { needsNativeMapsRebuild, isNativeMapsSupported } = await import("@/src/maps/provider");
    expect(needsNativeMapsRebuild()).toBe(true);
    expect(isNativeMapsSupported()).toBe(false);
  });
});

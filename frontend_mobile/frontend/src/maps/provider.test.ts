import { afterEach, describe, expect, it, vi } from "vitest";

describe("isNativeMapsSupported", () => {
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
    const { isNativeMapsSupported } = await import("@/src/maps/provider");
    expect(isNativeMapsSupported()).toBe(true);
  });

  it("enables native maps on iOS without a Google key", async () => {
    vi.doMock("expo-constants", () => ({
      default: { expoConfig: { android: { config: { googleMaps: { apiKey: "" } } } } },
    }));
    vi.doMock("react-native", () => ({ Platform: { OS: "ios" } }));
    const { isNativeMapsSupported } = await import("@/src/maps/provider");
    expect(isNativeMapsSupported()).toBe(true);
  });
});

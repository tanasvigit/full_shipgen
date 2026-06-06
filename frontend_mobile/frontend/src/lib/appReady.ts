import { AppState, type AppStateStatus } from "react-native";

/** Wait until the app is foregrounded and the Android activity has settled. */
export function waitForAppActive(extraDelayMs = 0): Promise<void> {
  return new Promise((resolve) => {
    const settle = () => {
      setTimeout(resolve, extraDelayMs);
    };

    if (AppState.currentState === "active") {
      settle();
      return;
    }

    const subscription = AppState.addEventListener("change", (state: AppStateStatus) => {
      if (state === "active") {
        subscription.remove();
        settle();
      }
    });
  });
}

export function isActivityUnavailableError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error ?? "");
  return /activity is no longer available|current activity is no longer available/i.test(message);
}

import { AppState, type AppStateStatus } from "react-native";

export function subscribeAppState(listener: (state: AppStateStatus) => void) {
  const sub = AppState.addEventListener("change", listener);
  return () => sub.remove();
}

export function isForeground(state: AppStateStatus) {
  return state === "active";
}

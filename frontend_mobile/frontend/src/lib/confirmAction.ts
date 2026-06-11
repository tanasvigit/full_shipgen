import { Alert } from "react-native";

export function confirmAction(
  title: string,
  message: string,
  options?: { confirmLabel?: string; destructive?: boolean }
): Promise<boolean> {
  const confirmLabel = options?.confirmLabel || "Confirm";
  const destructive = options?.destructive ?? false;

  return new Promise((resolve) => {
    Alert.alert(title, message, [
      { text: "Cancel", style: "cancel", onPress: () => resolve(false) },
      {
        text: confirmLabel,
        style: destructive ? "destructive" : "default",
        onPress: () => resolve(true),
      },
    ]);
  });
}

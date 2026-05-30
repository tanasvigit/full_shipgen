function apiHostname() {
  const base = process.env.EXPO_PUBLIC_API_BASE_URL || "http://localhost:8000/int/v1";
  try {
    return new URL(base).hostname;
  } catch {
    return "localhost";
  }
}

export function resolveSocketConfig() {
  const hostname = process.env.EXPO_PUBLIC_SOCKET_HOSTNAME || apiHostname();
  const port = Number(process.env.EXPO_PUBLIC_SOCKET_PORT || 38000);
  const secure =
    process.env.EXPO_PUBLIC_SOCKET_SECURE === "true" ||
    process.env.EXPO_PUBLIC_SOCKET_SECURE === "1";
  const path = process.env.EXPO_PUBLIC_SOCKET_PATH || "/socketcluster/";

  return {
    hostname,
    port,
    secure,
    path,
    autoConnect: true,
    connectTimeout: 10_000,
  };
}

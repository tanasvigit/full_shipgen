import { env } from "@/lib/env";
import { orgStorage } from "@/lib/storage";

/** Resolve SocketCluster connection options (Ember console parity). */
export function resolveSocketConfig() {
  const path = import.meta.env.VITE_SOCKETCLUSTER_PATH || "/socketcluster/";

  const secure =
    import.meta.env.VITE_SOCKETCLUSTER_SECURE === "true" ||
    (typeof window !== "undefined" && window.location.protocol === "https:");

  const useSameOriginProxy =
    import.meta.env.VITE_SOCKETCLUSTER_PROXY === "true" ||
    import.meta.env.VITE_SOCKETCLUSTER_PROXY === "1";

  if (useSameOriginProxy && typeof window !== "undefined") {
    const defaultPort = secure ? 443 : 80;
    return {
      hostname: window.location.hostname,
      port: Number(window.location.port || defaultPort),
      secure,
      path,
      autoConnect: true,
      authTokenName: "token",
    };
  }

  const host =
    import.meta.env.VITE_SOCKETCLUSTER_HOST ||
    (typeof window !== "undefined" ? window.location.hostname : "localhost");

  const port = Number(import.meta.env.VITE_SOCKETCLUSTER_PORT || 38000);

  return {
    hostname: host,
    port,
    secure,
    path,
    autoConnect: true,
    authTokenName: "token",
  };
}

export function resolveCompanyChannelId() {
  const org = orgStorage.get();
  const id = org?.uuid || org?.id;
  return id ? `company.${id}` : null;
}

export function orderChannelId(order) {
  const pid = order?.public_id || order?.publicId || order?.tracking_number || order?.trackingNumber;
  return pid ? `order.${pid}` : null;
}

export function driverChannelId(driver) {
  const pid = driver?.public_id || driver?.publicId;
  return pid ? `driver.${pid}` : null;
}

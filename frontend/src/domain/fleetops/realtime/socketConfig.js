import { env } from "@/lib/env";
import { orgStorage } from "@/lib/storage";

/** Resolve SocketCluster connection options (Ember console parity). */
export function resolveSocketConfig() {
  const host =
    import.meta.env.VITE_SOCKETCLUSTER_HOST ||
    (typeof window !== "undefined" ? window.location.hostname : "localhost");

  const port = Number(
    import.meta.env.VITE_SOCKETCLUSTER_PORT ||
      (typeof window !== "undefined" && window.location.port === "4200" ? 38000 : window.location?.port || 38000),
  );

  const secure =
    import.meta.env.VITE_SOCKETCLUSTER_SECURE === "true" ||
    (typeof window !== "undefined" && window.location.protocol === "https:");

  const path = import.meta.env.VITE_SOCKETCLUSTER_PATH || "/socketcluster/";

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

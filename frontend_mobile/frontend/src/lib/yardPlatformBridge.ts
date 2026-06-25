import { getStoredSession } from "@/src/lib/api";
import { getStoredYardSession } from "@/src/lib/ymsApi";
import type { MobileUser } from "@/src/services/authService";
import { ymsAuthService } from "@/src/services/ymsAuthService";
import { logEvent } from "@/src/services/observability";

/** Silently bridge Shipgen admin sessions into Yard when no YMS password login exists. */
export async function ensureYardPlatformBridge(fleetUser: MobileUser | null | undefined) {
  if (!fleetUser?.isAdmin) return false;

  const yardSession = await getStoredYardSession();
  if (yardSession?.accessToken) return true;

  const fleetSession = await getStoredSession();
  if (!fleetSession?.token) return false;

  try {
    await ymsAuthService.platformLogin(fleetSession.token);
    logEvent("yard.platform_bridge.success", { email: fleetUser.email });
    return true;
  } catch (error) {
    logEvent("yard.platform_bridge.failed", {
      email: fleetUser.email,
      message: error instanceof Error ? error.message : String(error),
    });
    return false;
  }
}

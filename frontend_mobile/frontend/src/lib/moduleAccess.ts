import type { MobileUser } from "@/src/services/authService";
import { isDriverUser } from "@/src/lib/driver";

export type MobileModule = "driver" | "yard";

/** Which modules appear on the Shipgen landing screen after auth context is known. */
export function visibleMobileModules(
  user: MobileUser | null | undefined,
  options?: { isYardAuthenticated?: boolean },
): MobileModule[] {
  if (!user) return ["driver", "yard"];

  if (user.isAdmin) return ["driver", "yard"];

  if (isDriverUser(user)) return ["driver"];

  // Dispatch / ops Shipgen users may open Yard with a separate YMS operator login.
  return ["driver", "yard"];
}

/** Default post-login destination for Shipgen users hitting `/`. */
export function defaultMobileHome(user: MobileUser | null | undefined): string | null {
  if (!user) return null;
  if (user.isAdmin) return null;
  if (isDriverUser(user)) return "/(tabs)/orders";
  return null;
}

/** Yard bottom tabs gated by YMS module permissions. */
export const YARD_TAB_MODULES: Record<string, string | null> = {
  gate: "module.gate",
  queue: "module.queue",
  profile: null,
};

export function canAccessYardTab(tabName: string, can: (permission: string) => boolean, isYardAdmin: boolean) {
  if (isYardAdmin || can("*")) return true;
  const mod = YARD_TAB_MODULES[tabName];
  if (!mod) return true;
  return can(mod);
}

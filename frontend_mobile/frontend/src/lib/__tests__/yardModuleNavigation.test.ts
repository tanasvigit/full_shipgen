import { describe, expect, it } from "vitest";
import {
  activeYardModuleKey,
  buildYardModuleHref,
  resolveYardNavOrigin,
  shouldReturnToMoreHub,
  shouldShowYardModuleTopBar,
} from "@/src/lib/yardModuleNavigation";
import type { YardModuleLink } from "@/src/lib/yardModules";

const vehiclesLink: YardModuleLink = {
  key: "vehicles",
  title: "Vehicle monitor",
  description: "Track vehicles",
  icon: "bus-outline",
  href: "/(yard)/vehicles",
  section: "Operations",
  modulePermission: "module.vehicles",
};

const gateLink: YardModuleLink = {
  key: "gate",
  title: "Gate",
  description: "Gate activity",
  icon: "shield-checkmark-outline",
  href: "/(yard)/gate",
  section: "Operations",
  modulePermission: "module.gate",
};

describe("yardModuleNavigation", () => {
  it("detects active module from pathname", () => {
    expect(activeYardModuleKey("/(yard)/vehicles")).toBe("vehicles");
    expect(activeYardModuleKey("/(yard)/more")).toBe("more");
  });

  it("tags all screens opened from More with from=more", () => {
    expect(buildYardModuleHref(vehiclesLink, "more")).toEqual({
      pathname: "/(yard)/vehicles",
      params: { from: "more" },
    });
    expect(buildYardModuleHref(gateLink, "more")).toEqual({
      pathname: "/(yard)/gate",
      params: { from: "more" },
    });
    expect(buildYardModuleHref(vehiclesLink, "tab")).toBe("/(yard)/vehicles");
  });

  it("resolves origin from route params and pathname", () => {
    expect(resolveYardNavOrigin("/(yard)/vehicles", "more")).toBe("more");
    expect(resolveYardNavOrigin("/(yard)/more")).toBe("more");
    expect(resolveYardNavOrigin("/(yard)/gate")).toBe("tab");
  });

  it("shows the module bar only inside the More flow", () => {
    expect(shouldShowYardModuleTopBar("/(yard)/vehicles", true)).toBe(true);
    expect(shouldShowYardModuleTopBar("/(yard)/vehicles", false)).toBe(false);
    expect(shouldShowYardModuleTopBar("/(yard)/overview", true)).toBe(false);
    expect(shouldShowYardModuleTopBar("/(yard)/search", true)).toBe(false);
    expect(shouldShowYardModuleTopBar("/(yard)/alerts", true)).toBe(false);
    expect(shouldShowYardModuleTopBar("/(yard)/profile", true)).toBe(false);
    expect(shouldShowYardModuleTopBar("/(yard)/more", true)).toBe(false);
  });

  it("returns to More hub for any module opened from More", () => {
    expect(shouldReturnToMoreHub("/(yard)/vehicles", true)).toBe(true);
    expect(shouldReturnToMoreHub("/(yard)/gate", true)).toBe(true);
    expect(shouldReturnToMoreHub("/(yard)/vehicles", false)).toBe(false);
  });
});

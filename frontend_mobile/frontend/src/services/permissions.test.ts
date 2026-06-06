import { describe, expect, it } from "vitest";
import { createPermissionResolver, resolveEffectivePermissions } from "@/src/services/permissions";

describe("permissions", () => {
  it("merges direct, role, and policy permissions", () => {
    const user = {
      permissions: ["fleet-ops view order"],
      role: {
        permissions: ["fleet-ops list driver"],
        policies: [{ permissions: ["fleet-ops update order"] }],
      },
      policies: [{ permissions: ["fleet-ops dispatch order"] }],
    };

    const set = resolveEffectivePermissions(user);
    expect(set.has("fleet-ops view order")).toBe(true);
    expect(set.has("fleet-ops list driver")).toBe(true);
    expect(set.has("fleet-ops update order")).toBe(true);
    expect(set.has("fleet-ops dispatch order")).toBe(true);
  });

  it("supports wildcard fleet-ops permissions", () => {
    const resolver = createPermissionResolver({
      permissions: ["fleet-ops * order"],
    });
    expect(resolver.canFleetops("dispatch", "order")).toBe(true);
    expect(resolver.canFleetops("delete", "vehicle")).toBe(false);
  });

  it("supports global wildcard", () => {
    const resolver = createPermissionResolver({
      permissions: ["fleet-ops *"],
    });
    expect(resolver.canFleetops("create", "order")).toBe(true);
  });

  it("bypasses checks for admin users", () => {
    const resolver = createPermissionResolver({ is_admin: true, permissions: [] });
    expect(resolver.canFleetops("delete", "order")).toBe(true);
  });
});

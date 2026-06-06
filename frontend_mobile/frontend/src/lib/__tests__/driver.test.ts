import { describe, expect, it } from "vitest";
import { isDriverUser, orderAssignedToDriver, resolveDriverTrackId } from "@/src/lib/driver";
import type { MobileUser } from "@/src/services/authService";

function makeUser(partial: Partial<MobileUser["raw"]> = {}): MobileUser {
  return {
    id: "user-1",
    name: "Driver One",
    email: "driver@test.local",
    role: "Driver",
    permissions: [],
    isAdmin: false,
    raw: {
      type: "driver",
      driver: { public_id: "driver_abc123", uuid: "uuid-driver" },
      ...partial,
    },
  };
}

describe("driver helpers", () => {
  it("resolves driver track id from linked driver record", () => {
    expect(resolveDriverTrackId(makeUser())).toBe("driver_abc123");
  });

  it("detects driver users", () => {
    expect(isDriverUser(makeUser())).toBe(true);
    expect(isDriverUser(null)).toBe(false);
  });

  it("matches orders assigned to the current driver", () => {
    const user = makeUser();
    expect(orderAssignedToDriver("driver_abc123", user)).toBe(true);
    expect(orderAssignedToDriver("uuid-driver", user)).toBe(true);
    expect(orderAssignedToDriver("other", user)).toBe(false);
  });
});

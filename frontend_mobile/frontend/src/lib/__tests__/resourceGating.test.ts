import { describe, expect, it } from "vitest";
import {
  canStartLoadingForVehicleStatus,
  canStartLoadingFromReadiness,
  computeMandatoryReadiness,
} from "@/src/lib/resourceGating";

describe("resourceGating", () => {
  it("requires READY_FOR_LOADING vehicle status", () => {
    expect(canStartLoadingForVehicleStatus("READY_FOR_LOADING")).toBe(true);
    expect(canStartLoadingForVehicleStatus("DOCK_ASSIGNED")).toBe(false);
    expect(canStartLoadingForVehicleStatus("LOADING")).toBe(false);
  });

  it("requires readiness.ready", () => {
    expect(canStartLoadingFromReadiness({ ready: true })).toBe(true);
    expect(canStartLoadingFromReadiness({ ready: false })).toBe(false);
  });

  it("treats dock and labor as mandatory", () => {
    expect(computeMandatoryReadiness({ dockAssigned: true, laborAssigned: true })).toMatchObject({
      ready: true,
      missing: [],
    });
    expect(computeMandatoryReadiness({ dockAssigned: true, laborAssigned: false })).toMatchObject({
      ready: false,
      missing: ["labor"],
    });
  });
});

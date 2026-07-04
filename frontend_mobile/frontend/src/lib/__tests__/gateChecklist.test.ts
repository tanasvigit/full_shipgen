import { describe, expect, it } from "vitest";
import { patchExitCheck } from "@/src/lib/gateChecklist";

describe("gateChecklist", () => {
  it("patches a single exit checklist row locally", () => {
    const checks = [
      { id: "a", label: "Loading completed", passed: false, field: "loading_completed_verified" },
      { id: "b", label: "Vehicle verified", passed: false, field: "vehicle_verified" },
    ];
    const next = patchExitCheck(checks, "vehicle_verified", true);
    expect(next[1]?.passed).toBe(true);
    expect(next[0]?.passed).toBe(false);
  });
});

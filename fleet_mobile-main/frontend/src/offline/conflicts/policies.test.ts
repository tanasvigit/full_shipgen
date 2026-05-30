import { describe, expect, it } from "vitest";
import { classifyConflict, conflictMessage } from "@/src/offline/conflicts/policies";

describe("conflict policies", () => {
  it("classifies stale workflow errors", () => {
    expect(classifyConflict({ status: 400, message: "There is nothing to see here." })).toBe("stale_workflow");
  });

  it("classifies canceled orders", () => {
    expect(classifyConflict({ status: 404, message: "order not found" })).toBe("order_canceled");
  });

  it("returns actionable messages", () => {
    expect(conflictMessage("driver_unassigned")).toContain("no longer assigned");
  });
});

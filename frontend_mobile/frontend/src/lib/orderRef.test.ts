import { describe, expect, it } from "vitest";
import { resolveOrderMutationRef, resolveOrderTrackingRef } from "./orderRef";

describe("orderRef", () => {
  it("prefers uuid for mutations", () => {
    expect(
      resolveOrderMutationRef(
        { id: "38df01cd-3285-4a66-b4ef-24f76697725f", code: "order_b9LtlgojWK" },
        "route-fallback"
      )
    ).toBe("38df01cd-3285-4a66-b4ef-24f76697725f");
  });

  it("prefers public id for tracking", () => {
    expect(
      resolveOrderTrackingRef(
        { id: "38df01cd-3285-4a66-b4ef-24f76697725f", code: "order_b9LtlgojWK" },
        "route-fallback"
      )
    ).toBe("order_b9LtlgojWK");
  });

  it("falls back to route ref when order fields are missing", () => {
    expect(resolveOrderMutationRef(null, "order_b9LtlgojWK")).toBe("order_b9LtlgojWK");
  });

  it("ignores literal undefined strings", () => {
    expect(resolveOrderMutationRef({ id: "undefined", code: "order_abc" })).toBe("order_abc");
  });
});

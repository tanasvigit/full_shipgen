import { describe, expect, it } from "vitest";
import { unwrapEntity, unwrapList } from "@/src/lib/apiUnwrap";

describe("api unwrap helpers", () => {
  it("unwraps list payloads from known keys", () => {
    expect(unwrapList({ orders: [{ id: 1 }] }, ["orders"])).toEqual([{ id: 1 }]);
    expect(unwrapList([{ id: 2 }])).toEqual([{ id: 2 }]);
    expect(unwrapList({ data: [{ id: 3 }] })).toEqual([{ id: 3 }]);
  });

  it("unwraps entity payloads from known keys", () => {
    expect(unwrapEntity({ order: { id: "o1" } }, ["order"])).toEqual({ id: "o1" });
    expect(unwrapEntity({ data: { id: "o2" } })).toEqual({ id: "o2" });
    expect(unwrapEntity({ id: "o3" })).toEqual({ id: "o3" });
  });
});

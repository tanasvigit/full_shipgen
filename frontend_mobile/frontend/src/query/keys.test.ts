import { describe, expect, it } from "vitest";
import { ORDERS_LIST_PARAMS, queryKeys } from "@/src/query/keys";

describe("queryKeys", () => {
  it("scopes keys by company uuid", () => {
    const companyA = "company-a";
    const companyB = "company-b";

    expect(queryKeys.orders(companyA, ORDERS_LIST_PARAMS)).toEqual([
      "orders",
      companyA,
      ORDERS_LIST_PARAMS,
    ]);
    expect(queryKeys.order(companyA, "order-1")).toEqual(["order", companyA, "order-1"]);
    expect(queryKeys.nextActivity(companyA, "order-1")).toEqual([
      "nextActivity",
      companyA,
      "order-1",
    ]);

    expect(queryKeys.orders(companyA, ORDERS_LIST_PARAMS)).not.toEqual(
      queryKeys.orders(companyB, ORDERS_LIST_PARAMS)
    );
  });
});

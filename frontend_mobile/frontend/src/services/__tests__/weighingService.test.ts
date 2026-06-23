import { describe, expect, it, vi } from "vitest";

vi.mock("@/src/lib/ymsApi", () => ({
  ymsRequest: vi.fn(),
}));

import { formatWeightKg, readQueueWeightKg } from "@/src/services/weighingService";

describe("weighingService", () => {
  it("formats kg with locale grouping", () => {
    expect(formatWeightKg(4200)).toBe("4,200 kg");
    expect(formatWeightKg(null)).toBe("—");
  });

  it("reads snake_case and camelCase queue weights", () => {
    expect(readQueueWeightKg({ tare_weight_kg: 4000 }, "tare")).toBe(4000);
    expect(readQueueWeightKg({ tareWeightKg: 4100 }, "tare")).toBe(4100);
    expect(readQueueWeightKg({ gross_weight_kg: 12000, net_weight_kg: 8000 }, "gross")).toBe(12000);
    expect(readQueueWeightKg({ netWeightKg: 7500 }, "net")).toBe(7500);
    expect(readQueueWeightKg({}, "tare")).toBeNull();
  });
});

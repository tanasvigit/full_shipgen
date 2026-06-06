import { describe, expect, it } from "vitest";
import { normalizeRealtimeMessage } from "@/src/realtime/eventRouter";

describe("realtime eventRouter", () => {
  it("maps backend order events to canonical events", () => {
    const message = normalizeRealtimeMessage("company.uuid", {
      event: "order.driver_assigned",
      data: { id: "order_1" },
    });
    expect(message?.event).toBe("driver.assigned");
  });

  it("maps tracking updates", () => {
    const message = normalizeRealtimeMessage("order.order_1", {
      event: "order.location_updated",
      data: {},
    });
    expect(message?.event).toBe("tracking.updated");
  });
});

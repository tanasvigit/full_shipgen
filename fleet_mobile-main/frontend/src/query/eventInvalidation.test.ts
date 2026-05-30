import { describe, expect, it, vi } from "vitest";
import { invalidateForRealtimeEvent } from "@/src/query/eventInvalidation";

describe("eventInvalidation", () => {
  it("invalidates order scope for order.updated", async () => {
    const invalidateQueries = vi.fn();
    const queryClient = { invalidateQueries } as never;

    await invalidateForRealtimeEvent(queryClient, "company-1", {
      event: "order.updated",
      rawEvent: "order.updated",
      channelId: "order.abc",
      data: { uuid: "order-1" },
    });

    expect(invalidateQueries).toHaveBeenCalled();
  });

  it("invalidates fleet aggregate for notification.created", async () => {
    const invalidateQueries = vi.fn();
    const queryClient = { invalidateQueries } as never;

    await invalidateForRealtimeEvent(queryClient, "company-1", {
      event: "notification.created",
      rawEvent: "notification.created",
      channelId: "company.company-1",
      data: {},
    });

    expect(invalidateQueries).toHaveBeenCalled();
  });
});

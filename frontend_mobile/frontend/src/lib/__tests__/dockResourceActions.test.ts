import { describe, expect, it } from "vitest";
import { buildCallableQueueEntries } from "@/src/lib/dockResourceActions";

describe("buildCallableQueueEntries", () => {
  it("includes waiting queue entries without a dock", () => {
    const rows = buildCallableQueueEntries(
      [
        { id: "q1", status: "WAITING", queue_number: "Q-101", vehicle_id: "v1" },
        { id: "q2", status: "DOCK_ASSIGNED", queue_number: "Q-102", vehicle_id: "v2", dock_id: "d1" },
      ],
      [{ id: "v1", vehicle_number: "MH12AB1234" }],
    );

    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      id: "q1",
      plate: "MH12AB1234",
      queueNumber: "Q-101",
    });
  });

  it("includes called entries that are not dock-assigned yet", () => {
    const rows = buildCallableQueueEntries(
      [{ id: "q3", status: "CALLED", queue_number: "Q-103", vehicle_id: "v3" }],
      [{ id: "v3", vehicle_number: "KA01CD5678" }],
    );

    expect(rows).toHaveLength(1);
    expect(rows[0]?.status).toBe("CALLED");
  });
});

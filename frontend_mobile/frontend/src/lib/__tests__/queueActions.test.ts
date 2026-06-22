import { describe, expect, it } from "vitest";
import {
  canAssignDockToEntry,
  canCallQueueEntry,
  filterQueueEntries,
  resolveQueueActions,
} from "@/src/lib/queueActions";
import { summarizeDockAvailability } from "@/src/lib/queueActions";
import { YMS_PERMISSIONS } from "@/src/lib/ymsPermissions";

const coordinatorCan = (permission: string) =>
  permission === "*" ||
  [YMS_PERMISSIONS.FLOW_CALL, YMS_PERMISSIONS.FLOW_ASSIGN_DOCK, YMS_PERMISSIONS.QUEUE_WRITE].includes(
    permission as typeof YMS_PERMISSIONS.FLOW_CALL,
  );

describe("queueActions", () => {
  it("allows call for waiting entries", () => {
    expect(canCallQueueEntry({ status: "WAITING", displayStatus: "READY_TO_CALL" })).toBe(true);
    expect(canCallQueueEntry({ status: "CALLED", displayStatus: "CALLED" })).toBe(false);
  });

  it("allows dock assign only after call", () => {
    expect(canAssignDockToEntry({ status: "CALLED" })).toBe(true);
    expect(canAssignDockToEntry({ status: "WAITING" })).toBe(false);
  });

  it("resolves call and assign actions for coordinator permissions", () => {
    const waiting = resolveQueueActions(
      { queueEntryId: "q1", status: "WAITING", displayStatus: "READY_TO_CALL" },
      coordinatorCan,
    );
    expect(waiting.find((action) => action.id === "call")?.enabled).toBe(true);
    expect(waiting.find((action) => action.id === "assign_dock")?.enabled).toBe(false);

    const called = resolveQueueActions(
      { queueEntryId: "q1", status: "CALLED", displayStatus: "CALLED" },
      coordinatorCan,
    );
    expect(called.find((action) => action.id === "assign_dock")?.enabled).toBe(true);
  });

  it("filters queue entries by search text", () => {
    const rows = [
      { queueEntryId: "1", plate: "ABC123", transporter: "Acme" },
      { queueEntryId: "2", plate: "XYZ999", transporter: "Beta" },
    ];
    expect(filterQueueEntries(rows, "abc")).toHaveLength(1);
  });

  it("summarizes dock availability counts", () => {
    const summary = summarizeDockAvailability([
      { id: "1", dockCode: "D1", status: "AVAILABLE" },
      { id: "2", dockCode: "D2", status: "OCCUPIED" },
      { id: "3", dockCode: "D3", status: "AVAILABLE" },
    ]);
    expect(summary.available).toBe(2);
    expect(summary.occupied).toBe(1);
  });
});

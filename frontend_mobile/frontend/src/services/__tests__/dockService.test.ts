import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  fetchDockBoard,
  fetchCallableQueueOptions,
  mapDockBoardRow,
} from "@/src/services/dockService";
import { ymsRequest } from "@/src/lib/ymsApi";

vi.mock("@/src/lib/ymsApi", () => ({
  ymsRequest: vi.fn(),
}));

const mockedYmsRequest = vi.mocked(ymsRequest);

describe("dockService permissions", () => {
  beforeEach(() => {
    mockedYmsRequest.mockReset();
  });
  it("skips queue entries when includeQueue is false", async () => {
    mockedYmsRequest.mockImplementation(async (path: string) => {
      if (path.startsWith("/docks")) {
        return { items: [{ id: "d1", dock_code: "D-01", status: "AVAILABLE" }] };
      }
      if (path.startsWith("/vehicles")) return { items: [] };
      if (path.startsWith("/labor")) return { items: [] };
      if (path.startsWith("/equipment")) return { items: [] };
      throw new Error(`Unexpected path ${path}`);
    });

    const bundle = await fetchDockBoard({ includeQueue: false });

    expect(bundle.rows).toHaveLength(1);
    expect(mockedYmsRequest).not.toHaveBeenCalledWith("/queue-entries?limit=500");
  });

  it("returns no callable queue options when includeQueue is false", async () => {
    const rows = await fetchCallableQueueOptions({ includeQueue: false });
    expect(rows).toEqual([]);
    expect(mockedYmsRequest).not.toHaveBeenCalled();
  });

  it("maps dock row with queue-assigned vehicle", () => {
    const row = mapDockBoardRow(
      { id: "d1", dock_code: "D-01", dock_name: "Dock 1", status: "AVAILABLE" },
      { id: "v1", vehicle_number: "ABC-123", transporter_name: "Acme", status: "DOCK_ASSIGNED" },
      { id: "q1", vehicle_id: "v1", status: "DOCK_ASSIGNED", queue_number: "Q-1" },
    );

    expect(row.hasActiveAssignment).toBe(true);
    expect(row.vehicleId).toBe("v1");
    expect(row.plate).toBe("ABC-123");
  });
});

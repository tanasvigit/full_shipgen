import { beforeEach, describe, expect, it, vi } from "vitest";
import { fetchVehicleMonitorBundle } from "@/src/services/vehicleMonitorService";
import { ymsRequest } from "@/src/lib/ymsApi";

vi.mock("@/src/lib/ymsApi", () => ({
  ymsRequest: vi.fn(),
}));

const mockedYmsRequest = vi.mocked(ymsRequest);

describe("vehicleMonitorService", () => {
  beforeEach(() => {
    mockedYmsRequest.mockReset();
  });
  it("loads monitor data from queue bundle when includeQueue is true", async () => {
    mockedYmsRequest.mockImplementation(async (path: string) => {
      if (path.startsWith("/vehicles")) {
        return { items: [{ id: "v1", vehicle_number: "KA01", status: "IN_YARD", current_zone_id: "z1" }] };
      }
      if (path.startsWith("/yard/zones")) {
        return { items: [{ id: "z1", zone_name: "Waiting", zone_type: "WAITING_AREA" }] };
      }
      if (path === "/queue/bundle") {
        return {
          entries: [{ vehicleId: "v1", dockCode: "D-01" }],
        };
      }
      throw new Error(`Unexpected path ${path}`);
    });

    const bundle = await fetchVehicleMonitorBundle({ includeQueue: true, includeDocks: false });

    expect(bundle.rows).toHaveLength(1);
    expect(bundle.rows[0]?.dockCode).toBe("D-01");
    expect(mockedYmsRequest).not.toHaveBeenCalledWith("/docks?limit=200");
  });

  it("loads dock codes from docks when includeQueue is false and includeDocks is true", async () => {
    mockedYmsRequest.mockImplementation(async (path: string) => {
      if (path.startsWith("/vehicles")) {
        return { items: [{ id: "v1", vehicle_number: "KA01", status: "LOADING" }] };
      }
      if (path.startsWith("/yard/zones")) {
        return { items: [] };
      }
      if (path.startsWith("/docks")) {
        return { items: [{ id: "d1", dock_code: "D-02", current_vehicle_id: "v1" }] };
      }
      throw new Error(`Unexpected path ${path}`);
    });

    const bundle = await fetchVehicleMonitorBundle({ includeQueue: false, includeDocks: true });

    expect(bundle.rows[0]?.dockCode).toBe("D-02");
    expect(mockedYmsRequest).not.toHaveBeenCalledWith("/queue/bundle");
  });
});

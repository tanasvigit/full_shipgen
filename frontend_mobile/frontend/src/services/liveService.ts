import { apiRequest, unwrapList } from "@/src/lib/api";
import type { DriverDTO } from "@/src/types/api/fleet";

export const liveService = {
  async listDrivers() {
    const payload = await apiRequest("/fleet-ops/live/drivers");
    return unwrapList<DriverDTO>(payload, ["drivers", "data"]);
  },
};

import { ymsRequest } from "@/src/lib/ymsApi";
import { mapYardMapSummary, mapYardZoneRow, type YardMapSummary, type YardZoneRow } from "@/src/lib/yardMapActions";
import { parseYmsList } from "@/src/services/queueService";

export type YardMapBundle = {
  summary: YardMapSummary;
  zones: YardZoneRow[];
};

export async function fetchYardMapBundle(): Promise<YardMapBundle> {
  const [zonesPayload, dashboardPayload] = await Promise.all([
    ymsRequest<unknown>("/yard/zones?limit=500"),
    ymsRequest<Record<string, unknown>>("/yard/dashboard"),
  ]);

  const zones = parseYmsList(zonesPayload)
    .map(mapYardZoneRow)
    .sort((a, b) => a.code.localeCompare(b.code, undefined, { numeric: true }));

  return {
    summary: mapYardMapSummary(dashboardPayload || {}),
    zones,
  };
}

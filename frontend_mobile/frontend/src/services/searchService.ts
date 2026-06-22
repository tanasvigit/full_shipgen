import { ymsRequest } from "@/src/lib/ymsApi";

export type SearchHit = {
  kind: string;
  id: string;
  label: string;
  sub: string;
  meta?: string | null;
  payload: Record<string, unknown>;
};

export type GlobalSearchResult = {
  results: SearchHit[];
  unavailable: { kind: string; reason: string }[];
};

export async function fetchGlobalSearch(query: string, limitPerGroup = 6): Promise<GlobalSearchResult> {
  const q = query.trim();
  if (!q) return { results: [], unavailable: [] };
  const payload = await ymsRequest<GlobalSearchResult>(
    `/search?q=${encodeURIComponent(q)}&limit_per_group=${limitPerGroup}`,
  );
  return {
    results: payload?.results ?? [],
    unavailable: payload?.unavailable ?? [],
  };
}

export function groupSearchResults(results: SearchHit[]) {
  const groups = new Map<string, SearchHit[]>();
  for (const hit of results) {
    const key = hit.kind || "other";
    const list = groups.get(key) ?? [];
    list.push(hit);
    groups.set(key, list);
  }
  return groups;
}

export const SEARCH_KIND_LABELS: Record<string, string> = {
  vehicle: "Vehicles",
  appointment: "Appointments",
  dock: "Docks",
  queue: "Queue entries",
  yard_event: "Yard events",
  equipment: "Equipment",
  labor: "Labor teams",
  detention: "Detention",
};

export function searchHitVehicleId(hit: SearchHit): string | null {
  if (hit.kind === "vehicle") return String(hit.id);
  const payload = hit.payload || {};
  if (payload.vehicleId) return String(payload.vehicleId);
  return null;
}

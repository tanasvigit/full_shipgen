import { fleetopsService } from "@/services/fleetops";
import { mapFleet } from "@/lib/mappers";
import { getRowId, upsertListRow } from "@/lib/fleetops/list-reconcile";

/**
 * List endpoints may omit a freshly created fleet; hydrate by id when needed.
 */
export async function hydrateFleetListRows(rows, preferredId) {
  let fromApi = rows.map(mapFleet);
  const id = preferredId || (typeof sessionStorage !== "undefined" ? sessionStorage.getItem("fleetops:last-created-fleet-id") : null);
  if (!id || fromApi.some((f) => getRowId(f) === String(id))) {
    return fromApi;
  }
  try {
    const raw = await fleetopsService.getFleet(id);
    if (raw) {
      fromApi = upsertListRow(fromApi, mapFleet(raw));
    }
  } catch {
    /* list index may lag behind create */
  }
  return fromApi;
}

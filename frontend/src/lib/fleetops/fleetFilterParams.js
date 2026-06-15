/** Shared fleet scope params for list APIs (orders, drivers, vehicles, live tracking). */

export function appendFleetFilterParams(params = {}, fleetId) {
  if (!fleetId || fleetId === "all") return { ...params };
  const id = String(fleetId);
  return {
    ...params,
    fleet: id,
    fleet_uuid: id,
    fleet_id: id,
    "filter[fleet]": id,
  };
}

export function fleetFilterFromState(fleetId) {
  return fleetId && fleetId !== "all" ? String(fleetId) : "";
}

/** URL + API helpers for fleets list filters and pagination. */

export const FLEET_LIST_DEFAULTS = {
  page: 1,
  limit: 50,
  sort: "created_at",
  sort_dir: "desc",
  status: "all",
  search: "",
  service_area: "",
  zone: "",
  vendor: "",
  parent_fleet: "",
  parents_only: false,
  layout: "cards",
};

export function buildFleetListApiParams(state) {
  const params = {
    page: state.page || FLEET_LIST_DEFAULTS.page,
    limit: state.limit || FLEET_LIST_DEFAULTS.limit,
    sort: state.sort || FLEET_LIST_DEFAULTS.sort,
    sort_dir: state.sort_dir === "asc" ? "asc" : "desc",
  };
  if (state.search?.trim()) {
    params.query = state.search.trim();
    params["filter[query]"] = state.search.trim();
  }
  if (state.status && state.status !== "all") {
    params.status = state.status;
    params["filter[status]"] = state.status;
  }
  if (state.service_area) {
    params.service_area = state.service_area;
    params["filter[serviceArea]"] = state.service_area;
  }
  if (state.zone) {
    params.zone = state.zone;
    params["filter[zone]"] = state.zone;
  }
  if (state.vendor) {
    params.vendor = state.vendor;
    params["filter[vendor]"] = state.vendor;
  }
  if (state.parent_fleet) {
    params.parent_fleet = state.parent_fleet;
    params["filter[parentFleet]"] = state.parent_fleet;
  }
  if (state.parents_only) {
    params.parents_only = 1;
    params["filter[parentsOnly]"] = 1;
  }
  return params;
}

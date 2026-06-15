import { EN_ROUTE_API_STATUS_VALUES, matchesOrderStatusFilter } from "@/domain/fleetops/status";
import { appendFleetFilterParams } from "@/lib/fleetops/fleetFilterParams";

/** URL + API query helpers for orders list (Day 1 — G001, G034, G055). */

export const ORDERS_LIST_DEFAULTS = {
  page: 1,
  limit: 25,
  layout: "table",
  status: "all",
  search: "",
  sort: "created_at",
  sort_dir: "desc",
  without_driver: false,
  order_config: "",
  fleet: "",
};

export function parseOrdersListSearchParams(searchParams) {
  const page = Math.max(1, Number(searchParams.get("page")) || ORDERS_LIST_DEFAULTS.page);
  const limit = Math.min(100, Math.max(10, Number(searchParams.get("limit")) || ORDERS_LIST_DEFAULTS.limit));
  const layout = searchParams.get("layout") || ORDERS_LIST_DEFAULTS.layout;
  const status = searchParams.get("status") || ORDERS_LIST_DEFAULTS.status;
  const search = searchParams.get("search") || ORDERS_LIST_DEFAULTS.search;
  const sort = searchParams.get("sort") || ORDERS_LIST_DEFAULTS.sort;
  const sort_dir = searchParams.get("sort_dir") === "asc" ? "asc" : "desc";
  const without_driver = searchParams.get("without_driver") === "1";
  const order_config = searchParams.get("order_config") || "";
  const bulk_query = searchParams.get("bulk_query") || "";
  const hidden_cols = searchParams.get("hidden_cols") || "";
  const fleet = searchParams.get("fleet") || "";
  return { page, limit, layout, status, search, sort, sort_dir, without_driver, order_config, bulk_query, hidden_cols, fleet };
}

export function buildOrdersListApiParams(state) {
  const params = {
    page: state.page,
    limit: state.limit,
    sort: state.sort,
    sort_dir: state.sort_dir,
  };
  if (state.search?.trim()) {
    params.query = state.search.trim();
    params.search = state.search.trim();
  }
  if (state.status && state.status !== "all") {
    // API `status` is the raw DB column; fetch a superset then refine client-side via effective status.
    if (state.status === "dispatched") {
      params.status = "created,dispatched";
      params["filter[status]"] = "created,dispatched";
    } else if (state.status === "assigned" || state.status === "created") {
      params.status = "created";
      params["filter[status]"] = "created";
      if (state.status === "created") {
        params.without_driver = 1;
        params["filter[without_driver]"] = 1;
      }
    } else if (state.status === "en_route") {
      const statusList = EN_ROUTE_API_STATUS_VALUES.join(",");
      params.status = statusList;
      params["filter[status]"] = statusList;
    } else {
      params.status = state.status;
      params["filter[status]"] = state.status;
    }
  }
  if (state.without_driver) {
    params.without_driver = 1;
    params["filter[without_driver]"] = 1;
  }
  if (state.order_config) {
    params.order_config_uuid = state.order_config;
    params["filter[order_config_uuid]"] = state.order_config;
  }
  if (state.bulk_query?.trim()) {
    params.bulk_query = state.bulk_query.trim();
  }
  return appendFleetFilterParams(params, state.fleet);
}

/** True when the API response contains every row for the current request (safe to recount after client filter). */
export function hasCompleteOrdersPage(fetchedRowCount, pageMeta) {
  const total = Number(pageMeta?.total ?? 0);
  return Number(pageMeta?.lastPage ?? 1) === 1 || fetchedRowCount >= total;
}

/** Refine mapped rows to the UI status bucket (effective status may differ from raw API `status`). */
export function applyOrdersListStatusFilter(rows, status) {
  if (!status || status === "all") return rows;
  return rows.filter((row) => matchesOrderStatusFilter(row, status));
}

/**
 * After client-side status refinement, align pagination meta with visible rows.
 * API totals are coarse for buckets like assigned, dispatched, and en_route.
 */
export function reconcileOrdersListMetaAfterStatusFilter({ pageMeta, filteredRows, fetchedRowCount, queryState }) {
  if (!queryState.status || queryState.status === "all") return pageMeta;
  if (!hasCompleteOrdersPage(fetchedRowCount, pageMeta)) return pageMeta;

  const perPage = pageMeta.perPage || queryState.limit;
  const total = filteredRows.length;
  const lastPage = Math.max(1, Math.ceil(total / perPage) || 1);
  const page = total === 0 ? 1 : Math.min(queryState.page, lastPage);
  return { ...pageMeta, total, lastPage, page, perPage };
}

export function ordersListSearchParamsFromState(state, overrides = {}) {
  const next = { ...state, ...overrides };
  const sp = new URLSearchParams();
  if (next.page && next.page !== 1) sp.set("page", String(next.page));
  if (next.limit && next.limit !== ORDERS_LIST_DEFAULTS.limit) sp.set("limit", String(next.limit));
  if (next.layout && next.layout !== "table") sp.set("layout", next.layout);
  if (next.status && next.status !== "all") sp.set("status", next.status);
  if (next.search) sp.set("search", next.search);
  if (next.sort && next.sort !== ORDERS_LIST_DEFAULTS.sort) sp.set("sort", next.sort);
  if (next.sort_dir && next.sort_dir !== ORDERS_LIST_DEFAULTS.sort_dir) sp.set("sort_dir", next.sort_dir);
  if (next.without_driver) sp.set("without_driver", "1");
  if (next.order_config) sp.set("order_config", next.order_config);
  if (next.bulk_query) sp.set("bulk_query", next.bulk_query);
  if (next.hidden_cols) sp.set("hidden_cols", next.hidden_cols);
  if (next.fleet) sp.set("fleet", next.fleet);
  return sp;
}

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
  return { page, limit, layout, status, search, sort, sort_dir, without_driver, order_config, bulk_query, hidden_cols };
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
    params.status = state.status;
    params["filter[status]"] = state.status;
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
  return params;
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
  return sp;
}

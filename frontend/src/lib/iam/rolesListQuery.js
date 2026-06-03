/** URL + API query helpers for IAM roles list. */

export const ROLES_LIST_DEFAULTS = {
  page: 1,
  limit: 25,
  sort: "-created_at",
  query: "",
  service: "",
  type: "",
};

export function parseRolesListSearchParams(searchParams) {
  const page = Math.max(1, Number(searchParams.get("page")) || ROLES_LIST_DEFAULTS.page);
  const limit = Math.min(100, Math.max(10, Number(searchParams.get("limit")) || ROLES_LIST_DEFAULTS.limit));
  const sort = searchParams.get("sort") || ROLES_LIST_DEFAULTS.sort;
  const query = searchParams.get("query") || "";
  const service = searchParams.get("service") || "";
  const type = searchParams.get("type") || "";
  return { page, limit, sort, query, service, type };
}

export function buildRolesListApiParams(state) {
  const params = {
    page: state.page,
    limit: state.limit,
    sort: state.sort,
  };
  if (state.query?.trim()) params.query = state.query.trim();
  if (state.service) params.service = state.service;
  if (state.type) params.type = state.type;
  return params;
}

export function rolesListSearchParamsFromState(state, overrides = {}) {
  const next = { ...state, ...overrides };
  const sp = new URLSearchParams();
  if (next.page && next.page !== 1) sp.set("page", String(next.page));
  if (next.limit && next.limit !== ROLES_LIST_DEFAULTS.limit) sp.set("limit", String(next.limit));
  if (next.sort && next.sort !== ROLES_LIST_DEFAULTS.sort) sp.set("sort", next.sort);
  if (next.query) sp.set("query", next.query);
  if (next.service) sp.set("service", next.service);
  if (next.type) sp.set("type", next.type);
  return sp;
}

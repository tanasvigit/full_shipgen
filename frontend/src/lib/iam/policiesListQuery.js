/** URL + API query helpers for IAM policies list. */

export const POLICIES_LIST_DEFAULTS = {
  page: 1,
  limit: 25,
  sort: "name",
  query: "",
  service: "",
  type: "",
};

export function parsePoliciesListSearchParams(searchParams) {
  const page = Math.max(1, Number(searchParams.get("page")) || POLICIES_LIST_DEFAULTS.page);
  const limit = Math.min(100, Math.max(10, Number(searchParams.get("limit")) || POLICIES_LIST_DEFAULTS.limit));
  const sort = searchParams.get("sort") || POLICIES_LIST_DEFAULTS.sort;
  const query = searchParams.get("query") || "";
  const service = searchParams.get("service") || "";
  const type = searchParams.get("type") || "";
  return { page, limit, sort, query, service, type };
}

export function buildPoliciesListApiParams(state) {
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

export function policiesListSearchParamsFromState(state, overrides = {}) {
  const next = { ...state, ...overrides };
  const sp = new URLSearchParams();
  if (next.page && next.page !== 1) sp.set("page", String(next.page));
  if (next.limit && next.limit !== POLICIES_LIST_DEFAULTS.limit) sp.set("limit", String(next.limit));
  if (next.sort && next.sort !== POLICIES_LIST_DEFAULTS.sort) sp.set("sort", next.sort);
  if (next.query) sp.set("query", next.query);
  if (next.service) sp.set("service", next.service);
  if (next.type) sp.set("type", next.type);
  return sp;
}

/** URL + API query helpers for IAM groups list. */

export const GROUPS_LIST_DEFAULTS = {
  page: 1,
  limit: 25,
  sort: "-created_at",
  query: "",
};

export function parseGroupsListSearchParams(searchParams) {
  const page = Math.max(1, Number(searchParams.get("page")) || GROUPS_LIST_DEFAULTS.page);
  const limit = Math.min(100, Math.max(10, Number(searchParams.get("limit")) || GROUPS_LIST_DEFAULTS.limit));
  const sort = searchParams.get("sort") || GROUPS_LIST_DEFAULTS.sort;
  const query = searchParams.get("query") || "";
  return { page, limit, sort, query };
}

export function buildGroupsListApiParams(state) {
  const params = {
    page: state.page,
    limit: state.limit,
    sort: state.sort,
  };
  if (state.query?.trim()) params.query = state.query.trim();
  return params;
}

export function groupsListSearchParamsFromState(state, overrides = {}) {
  const next = { ...state, ...overrides };
  const sp = new URLSearchParams();
  if (next.page && next.page !== 1) sp.set("page", String(next.page));
  if (next.limit && next.limit !== GROUPS_LIST_DEFAULTS.limit) sp.set("limit", String(next.limit));
  if (next.sort && next.sort !== GROUPS_LIST_DEFAULTS.sort) sp.set("sort", next.sort);
  if (next.query) sp.set("query", next.query);
  return sp;
}

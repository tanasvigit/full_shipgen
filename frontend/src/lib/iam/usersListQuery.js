/** URL + API query helpers for IAM users list (G-IAM001–003, G-IAM010–011). */

export const USERS_LIST_DEFAULTS = {
  page: 1,
  limit: 25,
  sort: "-created_at",
  query: "",
  role: "",
  status: "",
  name: "",
  email: "",
  phone: "",
};

export function parseUsersListSearchParams(searchParams) {
  const page = Math.max(1, Number(searchParams.get("page")) || USERS_LIST_DEFAULTS.page);
  const limit = Math.min(100, Math.max(10, Number(searchParams.get("limit")) || USERS_LIST_DEFAULTS.limit));
  const sort = searchParams.get("sort") || USERS_LIST_DEFAULTS.sort;
  const query = searchParams.get("query") || "";
  const role = searchParams.get("role") || "";
  const status = searchParams.get("status") || "";
  const name = searchParams.get("name") || "";
  const email = searchParams.get("email") || "";
  const phone = searchParams.get("phone") || "";
  return { page, limit, sort, query, role, status, name, email, phone };
}

export function buildUsersListApiParams(state, { listKind = "all" } = {}) {
  const params = {
    page: state.page,
    limit: state.limit,
    sort: state.sort,
  };
  if (state.query?.trim()) params.query = state.query.trim();
  if (state.role) params.role = state.role;
  if (state.status) params.status = state.status;
  if (state.name?.trim()) params.name = state.name.trim();
  if (state.email?.trim()) params.email = state.email.trim();
  if (state.phone?.trim()) params.phone = state.phone.trim();
  if (listKind === "drivers") params.is_driver = 1;
  if (listKind === "customers") params.is_customer = 1;
  return params;
}

export function usersListSearchParamsFromState(state, overrides = {}) {
  const next = { ...state, ...overrides };
  const sp = new URLSearchParams();
  if (next.page && next.page !== 1) sp.set("page", String(next.page));
  if (next.limit && next.limit !== USERS_LIST_DEFAULTS.limit) sp.set("limit", String(next.limit));
  if (next.sort && next.sort !== USERS_LIST_DEFAULTS.sort) sp.set("sort", next.sort);
  if (next.query) sp.set("query", next.query);
  if (next.role) sp.set("role", next.role);
  if (next.status) sp.set("status", next.status);
  if (next.name) sp.set("name", next.name);
  if (next.email) sp.set("email", next.email);
  if (next.phone) sp.set("phone", next.phone);
  return sp;
}

/** Map DataTable column key to API sort field. */
export const USERS_SORT_COLUMN_MAP = {
  name: "name",
  email: "email",
  phone: "phone",
  role: "role.name",
  status: "session_status",
  createdAt: "created_at",
};

export function usersSortFromTable(columnKey, direction) {
  const field = USERS_SORT_COLUMN_MAP[columnKey] || columnKey;
  return direction === "desc" ? `-${field}` : field;
}

export function usersTableSortFromApi(sortParam) {
  if (!sortParam) return { column: "createdAt", direction: "desc" };
  const desc = String(sortParam).startsWith("-");
  const raw = desc ? sortParam.slice(1) : sortParam;
  const column =
    Object.entries(USERS_SORT_COLUMN_MAP).find(([, v]) => v === raw)?.[0] ||
    (raw === "created_at" ? "createdAt" : raw);
  return { column, direction: desc ? "desc" : "asc" };
}

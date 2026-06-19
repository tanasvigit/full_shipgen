const ACCESS_KEY = "yms_access_token";
const REFRESH_KEY = "yms_refresh_token";
const IMPERSONATING_KEY = "yms_impersonating";

export const YMS_ROLES = [
  "yard_admin",
  "yard_manager",
  "gate_operator",
  "yard_coordinator",
  "dock_supervisor",
];

export const IMPERSONATABLE_ROLES = [
  "yard_manager",
  "gate_operator",
  "yard_coordinator",
  "dock_supervisor",
];

export const ROLE_LABELS = {
  yard_admin: "Yard Administrator",
  yard_manager: "Yard Manager",
  gate_operator: "Gate Operator",
  yard_coordinator: "Yard Coordinator",
  dock_supervisor: "Dock Supervisor",
};

export function getAccessToken() {
  return sessionStorage.getItem(ACCESS_KEY);
}

export function getRefreshToken() {
  return localStorage.getItem(REFRESH_KEY);
}

export function setTokens({ accessToken, refreshToken }) {
  if (accessToken) sessionStorage.setItem(ACCESS_KEY, accessToken);
  if (refreshToken) localStorage.setItem(REFRESH_KEY, refreshToken);
}

export function clearTokens() {
  sessionStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(REFRESH_KEY);
  sessionStorage.removeItem(IMPERSONATING_KEY);
}

export function setImpersonating(value) {
  if (value) sessionStorage.setItem(IMPERSONATING_KEY, "1");
  else sessionStorage.removeItem(IMPERSONATING_KEY);
}

export function isImpersonating() {
  return sessionStorage.getItem(IMPERSONATING_KEY) === "1";
}

/** Auth headers for API requests — JWT Bearer in production. */
export function getAuthHeaders() {
  const headers = {};
  const token = getAccessToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  if (process.env.REACT_APP_ENABLE_DEV_ROLE_OVERRIDE === "true") {
    const legacyRole = localStorage.getItem("yms_dev_role");
    const legacyUser = localStorage.getItem("yms_dev_user");
    if (legacyRole) headers["X-YMS-Role"] = legacyRole;
    if (legacyUser) headers["X-YMS-User"] = legacyUser;
  }
  return headers;
}

export function isAuthenticated() {
  return Boolean(getAccessToken() || getRefreshToken());
}

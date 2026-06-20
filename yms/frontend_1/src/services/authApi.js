import { API_BASE } from "./ymsApi";
import { clearTokens, getRefreshToken, setTokens } from "./authStorage";

async function authRequest(path, options = {}) {
  const url = `${API_BASE}${path}`;
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options,
  });
  const text = await res.text();
  let payload = null;
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = { detail: text };
    }
  }
  if (!res.ok) {
    let message = payload?.detail || `Request failed (${res.status})`;
    if (res.status === 401 && path === "/auth/login") {
      message = "Invalid email or password";
    }
    const error = new Error(typeof message === "string" ? message : "Request failed");
    error.status = res.status;
    error.payload = payload;
    throw error;
  }
  return payload;
}

export async function login(identity, password) {
  const data = await authRequest("/auth/login", {
    method: "POST",
    body: JSON.stringify({ identity: identity.trim(), password }),
  });
  setTokens({ accessToken: data.access_token, refreshToken: data.refresh_token });
  return data;
}

/** Exchange Shipgen session for a Yard JWT when embedded in the console. */
export async function platformLogin(platformAccessToken) {
  const data = await authRequest("/auth/platform-login", {
    method: "POST",
    headers: { Authorization: `Bearer ${platformAccessToken}` },
    body: JSON.stringify({}),
  });
  setTokens({ accessToken: data.access_token, refreshToken: data.refresh_token });
  return data;
}

export async function refreshSession() {
  const refreshToken = getRefreshToken();
  if (!refreshToken) throw new Error("No refresh token");
  const data = await authRequest("/auth/refresh", {
    method: "POST",
    body: JSON.stringify({ refresh_token: refreshToken }),
  });
  setTokens({ accessToken: data.access_token, refreshToken: data.refresh_token });
  return data;
}

export async function logoutApi() {
  const refreshToken = getRefreshToken();
  if (refreshToken) {
    try {
      await authRequest("/auth/logout", {
        method: "POST",
        body: JSON.stringify({ refresh_token: refreshToken }),
      });
    } catch {
      /* best-effort */
    }
  }
  clearTokens();
}

export async function fetchAuthMe(options = {}) {
  const { getAccessToken, getRefreshToken } = await import("./authStorage");
  const { request } = await import("./ymsApi");

  if (!getAccessToken() && getRefreshToken()) {
    await refreshSession();
  }

  try {
    return await request("/auth/me", options);
  } catch (err) {
    if (err.status === 401 && getRefreshToken()) {
      await refreshSession();
      return request("/auth/me", options);
    }
    throw err;
  }
}

export async function fetchRolePermissions() {
  const { request } = await import("./ymsApi");
  return request("/auth/permissions");
}

export async function impersonateRole(role) {
  const { request } = await import("./ymsApi");
  const data = await request("/auth/impersonate", {
    method: "POST",
    body: JSON.stringify({ role }),
  });
  setTokens({ accessToken: data.access_token, refreshToken: data.refresh_token });
  return data;
}

export { API_BASE };

/** Base path when YMS is embedded in Shipgen (`/yard`). Empty for standalone YMS. */

function readBasePath() {
  if (typeof import.meta !== "undefined" && import.meta.env?.VITE_YARD_BASE_PATH) {
    return String(import.meta.env.VITE_YARD_BASE_PATH).replace(/\/$/, "");
  }
  if (typeof process !== "undefined" && process.env?.REACT_APP_YARD_BASE_PATH) {
    return String(process.env.REACT_APP_YARD_BASE_PATH).replace(/\/$/, "");
  }
  return "";
}

export const YARD_BASE_PATH = readBasePath();
export const YARD_EMBEDDED = Boolean(YARD_BASE_PATH);

/** Prefix an in-app YMS route for embedded or standalone mode. */
export function yardPath(path = "/") {
  if (!path || path === "/") {
    return YARD_BASE_PATH || "/";
  }
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${YARD_BASE_PATH}${normalized}`;
}

export function yardAuthPath() {
  return YARD_EMBEDDED ? "/auth/login" : "/login";
}

export function yardUnauthorizedPath() {
  return YARD_EMBEDDED ? yardPath("/unauthorized") : "/unauthorized";
}

/** Strip Shipgen `/yard` prefix for permission route lookup. */
export function yardRelativePath(pathname) {
  if (!YARD_BASE_PATH) return pathname;
  if (pathname === YARD_BASE_PATH) return "/";
  if (pathname.startsWith(`${YARD_BASE_PATH}/`)) {
    return pathname.slice(YARD_BASE_PATH.length) || "/";
  }
  return pathname;
}

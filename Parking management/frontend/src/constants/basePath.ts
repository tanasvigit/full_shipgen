/** Base path when PMS is embedded in Shipgen (`/parking`). Empty for standalone. */

function readBasePath(): string {
  if (typeof import.meta !== 'undefined' && import.meta.env?.VITE_PMS_BASE_PATH) {
    return String(import.meta.env.VITE_PMS_BASE_PATH).replace(/\/$/, '');
  }
  if (typeof process !== 'undefined' && process.env?.REACT_APP_PMS_BASE_PATH) {
    return String(process.env.REACT_APP_PMS_BASE_PATH).replace(/\/$/, '');
  }
  return '';
}

export const PARKING_BASE_PATH = readBasePath();
export const PARKING_EMBEDDED = Boolean(PARKING_BASE_PATH);

export function parkingPath(path = '/'): string {
  if (!path || path === '/') {
    return PARKING_BASE_PATH || '/';
  }
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return `${PARKING_BASE_PATH}${normalized}`;
}

export function parkingAuthPath(): string {
  return PARKING_EMBEDDED ? '/auth?redirect=/parking' : '/login';
}

export function parkingUnauthorizedPath(): string {
  return PARKING_EMBEDDED ? parkingPath('/unauthorized') : '/unauthorized';
}

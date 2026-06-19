import { API_BASE, formatApiError } from "./ymsApi";
import { getAuthHeaders } from "./authStorage";

/**
 * Live global search — backed by GET /api/search (no db.js).
 * @returns {{ results: Array, unavailable: Array }}
 */
export async function fetchJumpResults(query) {
  const q = (query || "").trim();
  if (!q) return { results: [], unavailable: [] };

  const url = `${API_BASE}/search?q=${encodeURIComponent(q)}&limit_per_group=4`;
  let res;
  try {
    res = await fetch(url, { headers: { ...getAuthHeaders() } });
  } catch (err) {
    throw new Error(formatApiError(err, url));
  }

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
    const err = new Error(payload?.detail || `Search failed (${res.status})`);
    err.status = res.status;
    throw err;
  }

  return {
    results: payload?.results || [],
    unavailable: payload?.unavailable || [],
  };
}

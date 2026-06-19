/**
 * Permission-aware bundle fetch helpers.
 * Skips unauthorized API calls, catches 403s, returns safe defaults — never crashes page load.
 */

export function isForbiddenError(err) {
  if (!err) return false;
  if (err.status === 403) return true;
  const msg = String(err.message || err.detail || "");
  return /403|forbidden|cannot access module/i.test(msg);
}

/**
 * @template T
 * @param {boolean} allowed - whether the current role may call this API
 * @param {() => Promise<T>} fetcher
 * @param {T} fallback - value when skipped or forbidden
 * @returns {Promise<T>}
 */
export async function safeBundleFetch(allowed, fetcher, fallback) {
  if (!allowed) return fallback;
  try {
    return await fetcher();
  } catch (err) {
    if (isForbiddenError(err)) return fallback;
    throw err;
  }
}

/**
 * Run multiple bundle fetches; each entry is isolated (403 → fallback, other errors propagate).
 * @param {Array<{ allowed: boolean, fetch: () => Promise<any>, fallback: any }>} sources
 * @returns {Promise<any[]>}
 */
export async function safeBundleFetchAll(sources) {
  return Promise.all(
    sources.map(({ allowed, fetch, fallback }) => safeBundleFetch(allowed, fetch, fallback))
  );
}

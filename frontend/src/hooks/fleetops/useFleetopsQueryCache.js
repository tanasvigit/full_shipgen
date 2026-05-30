const store = new Map();

/**
 * Short-lived in-memory cache for list fetches (dedupe + background refresh).
 */
export function getCachedQuery(key, ttlMs = 12_000) {
  const hit = store.get(key);
  if (!hit) return null;
  if (Date.now() - hit.at > ttlMs) {
    store.delete(key);
    return null;
  }
  return hit.data;
}

export function setCachedQuery(key, data) {
  store.set(key, { data, at: Date.now() });
}

export function invalidateCachedQuery(keyOrPrefix) {
  if (!keyOrPrefix) {
    store.clear();
    return;
  }
  const prefix = String(keyOrPrefix);
  for (const k of store.keys()) {
    if (k.startsWith(prefix)) store.delete(k);
  }
}

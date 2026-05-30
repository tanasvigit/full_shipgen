/**
 * Cache, Redis, locks, session patterns.
 */

import { walkPhpFiles } from './backend-php-utils.mjs';

/**
 * @param {string} repoRoot
 * @param {object[]} packages
 * @param {(p: string) => string|null} readSafe
 */
export function buildCacheTopology(repoRoot, packages, readSafe) {
  const entries = [];
  const locks = [];
  const seen = new Set();

  const scanRoots = packages.map((p) => p.srcRoot).concat(['api/app']);

  for (const dir of scanRoots) {
    for (const rel of walkPhpFiles(repoRoot, dir)) {
      const content = readSafe(rel);
      if (!content) continue;
      const owner = rel.split('/').slice(-2).join('/');

      for (const m of content.matchAll(
        /Cache::(remember|put|get|forget|tags|flush)\s*\(\s*['"`]([^'"`]+)['"`]/g
      )) {
        const key = `${m[2]}|${m[1]}`;
        if (seen.has(key)) continue;
        seen.add(key);
        entries.push({
          key: m[2],
          operation: m[1],
          ttl: content.includes('now()->add') ? 'dynamic' : 'config/default',
          invalidation: m[1] === 'forget' || m[1] === 'flush' ? 'explicit' : 'TTL or manual',
          owner,
          file: rel,
        });
      }

      for (const m of content.matchAll(
        /->remember\s*\(\s*['"`]([^'"`]+)['"`]/g
      )) {
        entries.push({
          key: m[1],
          operation: 'remember',
          ttl: 'method arg',
          invalidation: '—',
          owner,
          file: rel,
        });
      }

      if (/Cache::lock|Redis::lock|->lock\s*\(/.test(content)) {
        locks.push({ file: rel, owner });
      }
    }
  }

  const fleetbaseConfig = readSafe('packages/core-api/config/fleetbase.php');
  const responseCache = readSafe('packages/core-api/config/responsecache.php');
  const sessionDriver =
    fleetbaseConfig?.match(/'session'[^}]*'driver'\s*=>\s*env\('([^']+)'/)?.[1] ||
    'redis/database';

  return {
    entries: entries.slice(0, 80),
    locks: locks.slice(0, 25),
    session: {
      driver: sessionDriver,
      userCache: fleetbaseConfig?.includes('USER_CACHE') ? 'USER_CACHE_ENABLED' : '—',
    },
    responseCache: responseCache ? 'Spatie response cache enabled' : 'optional',
    stats: {
      cacheOps: entries.length,
      locks: locks.length,
    },
  };
}

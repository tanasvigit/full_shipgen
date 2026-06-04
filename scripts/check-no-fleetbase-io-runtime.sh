#!/usr/bin/env sh
# Fail if fleetbase.io appears in runtime PHP/JS config (not package author metadata).
set -eu
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

scan() {
  rg "fleetbase\.io" "$@" \
    --glob '!**/composer.lock' \
    --glob '!**/package.json' \
    --glob '!**/composer.json' \
    --glob '!**/extension.json' \
    --glob '!**/pnpm-lock.yaml' \
    --glob '!**/*.md' \
    2>/dev/null && exit 1 || true
}

scan packages/core-api packages/registry-bridge packages/ember-core/addon packages/ember-ui/addon \
  packages/fleetops/server packages/storefront/server api/config docker-compose.yml docker/Dockerfile.onprem

echo "OK: no fleetbase.io in scanned runtime paths."
exit 0

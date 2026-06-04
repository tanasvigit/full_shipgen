#!/usr/bin/env sh
# On-prem Fleetbase: build API from packages/ and start Docker stack.
set -eu
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "Checking runtime paths for fleetbase.io..."
sh "$ROOT/scripts/check-no-fleetbase-io-runtime.sh"

if [ "${NO_BUILD:-}" != "1" ]; then
  echo "Building API image (fleetbase-api-onprem:local) — first run can take 20+ minutes..."
  docker compose build application
fi

if [ "${BUILD_ONLY:-}" = "1" ]; then
  echo "Build complete."
  exit 0
fi

echo "Starting services..."
docker compose up -d

echo ""
echo "On-prem stack is up."
echo "  API:     http://localhost:8000"
echo "  Console: http://localhost:4200"
echo "  React:   cd frontend && npm run dev  -> http://localhost:5173"
echo ""
echo "Docs: docs/ON-PREM-PACKAGES-NO-FLEETBASE-IO.md"

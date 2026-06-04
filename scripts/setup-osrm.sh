#!/usr/bin/env sh
# Build OSRM graph data as docker/osrm/data/map.osrm* (default: Monaco extract for dev).
set -eu

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DATA_DIR="${ROOT}/docker/osrm/data"
PBF_URL="${OSRM_PBF_URL:-https://download.geofabrik.de/europe/monaco-latest.osm.pbf}"
IMAGE="${OSRM_IMAGE:-osrm/osrm-backend}"
PBF_PATH="${DATA_DIR}/map.osm.pbf"
GRAPH="${DATA_DIR}/map.osrm"

mkdir -p "$DATA_DIR"

if [ -f "${GRAPH}" ] || [ -f "${GRAPH}.hsgr" ]; then
  echo "OSRM graph already present (${GRAPH}). Skipping."
  exit 0
fi

echo "Downloading ${PBF_URL} ..."
curl -fsSL -o "$PBF_PATH" "$PBF_URL"

echo "Extracting (large regions may take 30+ minutes) ..."
docker run --rm -t --platform linux/amd64 -v "${DATA_DIR}:/data" "$IMAGE" osrm-extract -p /opt/car.lua /data/map.osm.pbf

echo "Contracting ..."
docker run --rm -t --platform linux/amd64 -v "${DATA_DIR}:/data" "$IMAGE" osrm-contract /data/map.osrm

echo "Done. Start routing: docker compose up -d osrm-backend osrm"

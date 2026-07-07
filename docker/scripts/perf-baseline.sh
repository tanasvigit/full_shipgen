#!/usr/bin/env sh
set -eu

# Lightweight baseline sampler for FleetOps services.
# Usage: sh docker/scripts/perf-baseline.sh [seconds]

DURATION="${1:-60}"
END_TS=$(( $(date +%s) + DURATION ))

echo "ts,container,cpu_percent,mem_percent,mem_usage,net_io,block_io,pids"
while [ "$(date +%s)" -lt "$END_TS" ]; do
  docker stats --no-stream \
    --format "{{.Name}},{{.CPUPerc}},{{.MemPerc}},{{.MemUsage}},{{.NetIO}},{{.BlockIO}},{{.PIDs}}" \
    fleetbase-gateway-1 fleetbase-iam-service-1 fleetbase-fleetops-service-1 fleetbase-application-1 fleetbase-queue-1 fleetbase-cache-1 fleetbase-database-1 \
    | while IFS= read -r line; do
        printf "%s,%s\n" "$(date -u +%Y-%m-%dT%H:%M:%SZ)" "$line"
      done
  sleep 5
done

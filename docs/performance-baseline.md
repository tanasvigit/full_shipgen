# FleetOps Performance Baseline Checklist

Run this before and after each optimization phase to verify impact.

## 1) Infrastructure sample

- Collect container CPU/memory/network every 5s for 5 minutes:
  - `sh docker/scripts/perf-baseline.sh 300 > perf-baseline.csv`

## 2) API latency sample

- Capture p50/p95/p99 for these endpoints under comparable load:
  - `/int/v1/fleet-ops/live/orders`
  - `/int/v1/fleet-ops/live/drivers`
  - `/int/v1/fleet-ops/live/vehicles`
  - `/int/v1/orders`
  - `/int/v1/fleet-ops/orchestrator/orders`

## 3) Queue and Redis

- Track:
  - queue depth
  - failed jobs count
  - jobs processed/min
  - Redis memory used, evictions, latency

## 4) Web app

- Build stats:
  - `yarn build`
  - compare `dist/assets` JS and CSS sizes
- Lighthouse/DevTools:
  - LCP, INP, CLS, TTFB
  - number of dashboard and tracking API calls per minute

## 5) Mobile app

- On Yard/Fleet dashboard screens track:
  - requests/minute foreground
  - requests/minute background
  - battery drain %/hour
  - startup time to first data render

## 6) Regression gates

- API contracts unchanged.
- Playwright FleetOps smoke suites pass.
- No user-visible behavior/UI changes.

## Future Optimization Opportunities (Deferred)

- Refine Vite manual chunk strategy to reduce circular chunking and large vendor bundles.
- Tune OSRM fallback error cache TTL based on production timeout/error patterns.

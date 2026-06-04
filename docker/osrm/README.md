# Self-hosted OSRM (shipgen-fleet)

Fleetbase uses OSRM for road routing (order paths, driver routes, trip optimization).

| Service | URL | Used by |
|---------|-----|---------|
| `osrm-backend` | `http://osrm-backend:5000` | API container (`OSRM_HOST`) |
| `osrm` (nginx + CORS) | `http://localhost:5000` | Ember/React in the browser |

## First-time setup (map data)

You must preprocess an OpenStreetMap extract before `osrm-backend` can start.

**Quick test region (Monaco, ~1 MB):**

```powershell
powershell -File scripts/setup-osrm.ps1
```

```bash
sh scripts/setup-osrm.sh
```

**Production:** edit the script to download your region from [Geofabrik](https://download.geofabrik.de/) (e.g. `asia/india-latest.osm.pbf`). Preprocessing large countries can take 30–90+ minutes and needs several GB of disk/RAM.

After setup, start the stack:

```bash
docker compose up -d osrm-backend osrm application
```

## Verify

```bash
# From host (CORS proxy)
curl "http://localhost:5000/route/v1/driving/7.42,43.73;7.43,43.74"

# From API container (direct backend)
docker compose exec application curl -s "http://osrm-backend:5000/route/v1/driving/7.42,43.73;7.43,43.74" | head -c 120
```

Expect JSON with `"code":"Ok"`.

Uses Docker Hub `osrm/osrm-backend` (Contraction Hierarchies / `ch` algorithm) for broad `linux/amd64` support.

## Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `OSRM_HOST` | `http://osrm-backend:5000` | API → OSRM (in `api/.env` / compose) |
| `OSRM_GRAPH` | `map.osrm` | Basename of processed graph in `docker/osrm/data/` |
| `OSRM_TIMEOUT` | `30` | HTTP timeout (seconds) for API OSRM calls |

Browser: set `OSRM_HOST` in `console/fleetbase.config.json` to `http://localhost:5000`.

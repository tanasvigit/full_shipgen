# Map tiles (port 8080)

Serves `http://localhost:8080/styles/basic/{z}/{x}/{y}.png` for Leaflet (matches `MAP_TILE_URL` / `VITE_MAP_TILE_URL`).

Proxies to OpenStreetMap public tiles for local dev. For production, replace with [TileServer GL](https://github.com/maptiler/tileserver-gl) and point `MAP_TILE_URL` at your host.

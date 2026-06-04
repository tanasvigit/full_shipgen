/**
 * Map tile configuration for on-prem; use VITE_* or API /int/v1/settings/platform.
 */

const envDefaults = {
  tileUrl: import.meta.env.VITE_MAP_TILE_URL || "http://localhost:8080/styles/basic/{z}/{x}/{y}.png",
  tileUrlDark:
    import.meta.env.VITE_MAP_TILE_URL_DARK ||
    import.meta.env.VITE_MAP_TILE_URL ||
    "http://localhost:8080/styles/basic/{z}/{x}/{y}.png",
  attribution: import.meta.env.VITE_MAP_TILE_ATTRIBUTION || "© OpenStreetMap contributors",
  subdomains: import.meta.env.VITE_MAP_TILE_SUBDOMAINS || "",
  maxZoom: Number(import.meta.env.VITE_MAP_TILE_MAX_ZOOM || 19),
};

let remoteConfig = null;

export function setRemoteMapConfig(config) {
  remoteConfig = config?.maps || config || null;
}

export function getMapTileConfig(theme = "light") {
  const base = remoteConfig || envDefaults;
  const url = theme === "dark" && base.tile_url_dark ? base.tile_url_dark : base.tile_url || base.tileUrl;

  return {
    url: url || envDefaults.tileUrl,
    attribution: base.attribution || envDefaults.attribution,
    subdomains: base.subdomains || envDefaults.subdomains || undefined,
    maxZoom: Number(base.max_zoom ?? base.maxZoom ?? envDefaults.maxZoom),
  };
}

export function leafletTileLayerOptions(theme = "light") {
  const cfg = getMapTileConfig(theme);
  const opts = {
    attribution: cfg.attribution,
    maxZoom: cfg.maxZoom,
  };
  if (cfg.subdomains) {
    opts.subdomains = cfg.subdomains;
  }
  return { url: cfg.url, options: opts };
}

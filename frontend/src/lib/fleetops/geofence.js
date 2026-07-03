export function toLeafletPolygon(geometry) {
  if (!geometry) return [];
  if (Array.isArray(geometry)) return geometry;

  const type = geometry?.type;
  let ring = [];

  if (type === "MultiPolygon") {
    const firstPolygon = geometry.coordinates?.[0];
    ring = Array.isArray(firstPolygon?.[0]) ? firstPolygon[0] : [];
  } else if (type === "Polygon") {
    ring = geometry.coordinates?.[0] || [];
  } else {
    const raw = geometry?.coordinates || geometry?.polygon?.coordinates || [];
    if (Array.isArray(raw?.[0]?.[0]?.[0])) {
      ring = raw[0][0];
    } else if (Array.isArray(raw?.[0])) {
      ring = raw[0];
    }
  }

  return ring
    .filter((point) => Array.isArray(point) && point.length >= 2)
    .map(([lng, lat]) => [Number(lat), Number(lng)]);
}

export function toGeoJsonPolygon(latlngs = []) {
  const points = (latlngs || [])
    .filter((pair) => Array.isArray(pair) && pair.length >= 2)
    .map(([lat, lng]) => [Number(lng), Number(lat)]);
  if (points.length < 3) return null;
  const closed = [...points];
  const first = closed[0];
  const last = closed[closed.length - 1];
  if (first[0] !== last[0] || first[1] !== last[1]) closed.push(first);
  return { type: "Polygon", coordinates: [closed] };
}

/** Service areas persist `border` as GeoJSON MultiPolygon on the API. */
export function toMultiPolygonGeoJson(geoJsonOrLatLngs) {
  if (!geoJsonOrLatLngs) return null;

  let polygon = geoJsonOrLatLngs;
  if (Array.isArray(geoJsonOrLatLngs)) {
    polygon = toGeoJsonPolygon(geoJsonOrLatLngs);
  }
  if (!polygon) return null;
  if (polygon.type === "MultiPolygon") return polygon;
  if (polygon.type !== "Polygon") return null;

  return {
    type: "MultiPolygon",
    coordinates: [polygon.coordinates],
  };
}

/** Zones persist `border` as GeoJSON Polygon on the API. */
export function toZoneBorderGeoJson(geoJsonOrLatLngs) {
  if (!geoJsonOrLatLngs) return null;
  if (Array.isArray(geoJsonOrLatLngs)) return toGeoJsonPolygon(geoJsonOrLatLngs);
  if (geoJsonOrLatLngs.type === "Polygon") return geoJsonOrLatLngs;
  if (geoJsonOrLatLngs.type === "MultiPolygon") {
    const first = geoJsonOrLatLngs.coordinates?.[0];
    if (!first) return null;
    return { type: "Polygon", coordinates: first };
  }
  return null;
}

export function extractBorderGeometry(entity) {
  if (!entity || typeof entity !== "object") return null;
  return entity.border || entity.geometry || entity.polygon || null;
}

export function closedTrailPoints(latlngs = []) {
  const points = (latlngs || []).filter((pair) => Array.isArray(pair) && pair.length >= 2);
  if (points.length < 3) return points;
  const first = points[0];
  const last = points[points.length - 1];
  if (first[0] === last[0] && first[1] === last[1]) return points;
  return [...points, first];
}

export function isValidPolygon(latlngs = []) {
  return Array.isArray(latlngs) && latlngs.length >= 3;
}

/** Parse FleetOps GeoJSON Point / lat-lng object for map markers. */
export function coordsFromGeoPoint(location) {
  if (!location) return { lat: null, lng: null };
  const latRaw =
    location.latitude ?? location.lat ?? location.y ?? location.coordinates?.[1];
  const lngRaw =
    location.longitude ?? location.lng ?? location.lon ?? location.x ?? location.coordinates?.[0];
  const lat = latRaw != null && latRaw !== "" ? Number(latRaw) : null;
  const lng = lngRaw != null && lngRaw !== "" ? Number(lngRaw) : null;
  if (lat == null || lng == null || Number.isNaN(lat) || Number.isNaN(lng)) {
    return { lat: null, lng: null };
  }
  if (lat === 0 && lng === 0) return { lat: null, lng: null };
  return { lat, lng };
}

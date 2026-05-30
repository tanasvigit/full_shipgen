export function toLeafletPolygon(geometry) {
  if (!geometry) return [];
  if (Array.isArray(geometry)) return geometry;
  const raw = geometry?.coordinates || geometry?.polygon?.coordinates || [];
  const ring = Array.isArray(raw?.[0]) ? raw[0] : [];
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

export function isValidPolygon(latlngs = []) {
  return Array.isArray(latlngs) && latlngs.length >= 3;
}

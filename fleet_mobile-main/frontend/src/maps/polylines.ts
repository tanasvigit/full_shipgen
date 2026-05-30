import type { MapCoordinate } from "@/src/maps/markers";

export function buildRoutePolyline(points: MapCoordinate[]) {
  if (points.length < 2) return [];
  return points;
}

export function snapRoutePreview(points: MapCoordinate[]) {
  return points.filter((point, index, arr) => {
    if (index === 0) return true;
    const prev = arr[index - 1];
    const dLat = Math.abs(prev.latitude - point.latitude);
    const dLng = Math.abs(prev.longitude - point.longitude);
    return dLat + dLng > 0.00005;
  });
}

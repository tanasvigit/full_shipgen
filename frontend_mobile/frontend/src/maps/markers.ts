export type MapCoordinate = {
  latitude: number;
  longitude: number;
};

export type TripMapMarker = {
  id: string;
  coordinate: MapCoordinate;
  title: string;
  description?: string;
  kind: "pickup" | "dropoff" | "driver" | "waypoint";
};

export function defaultRegion(points: MapCoordinate[]) {
  if (!points.length) {
    return {
      latitude: 0,
      longitude: 0,
      latitudeDelta: 120,
      longitudeDelta: 120,
    };
  }

  const latitudes = points.map((p) => p.latitude);
  const longitudes = points.map((p) => p.longitude);
  const minLat = Math.min(...latitudes);
  const maxLat = Math.max(...latitudes);
  const minLng = Math.min(...longitudes);
  const maxLng = Math.max(...longitudes);

  return {
    latitude: (minLat + maxLat) / 2,
    longitude: (minLng + maxLng) / 2,
    latitudeDelta: Math.max(0.02, (maxLat - minLat) * 1.6 || 0.05),
    longitudeDelta: Math.max(0.02, (maxLng - minLng) * 1.6 || 0.05),
  };
}

export type TrackPoint = {
  latitude: number;
  longitude: number;
  capturedAt: number;
};

const DEDUPE_METERS_SQUARED = 0.000001;

function distanceSquared(a: TrackPoint, b: TrackPoint) {
  const dLat = a.latitude - b.latitude;
  const dLng = a.longitude - b.longitude;
  return dLat * dLat + dLng * dLng;
}

export function shouldAcceptPoint(previous: TrackPoint | null, next: TrackPoint) {
  if (!previous) return true;
  return distanceSquared(previous, next) > DEDUPE_METERS_SQUARED;
}

export function batchPoints(points: TrackPoint[], maxBatch = 20) {
  const batches: TrackPoint[][] = [];
  for (let i = 0; i < points.length; i += maxBatch) {
    batches.push(points.slice(i, i + maxBatch));
  }
  return batches;
}

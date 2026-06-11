import { useEffect, useMemo, useState } from "react";
import { useMap } from "@vis.gl/react-google-maps";

function toLatLng(point) {
  if (!point) return null;
  if (Array.isArray(point)) {
    return { lat: Number(point[0]), lng: Number(point[1]) };
  }
  return { lat: Number(point.lat), lng: Number(point.lng) };
}

/** Road-snapped path via Directions API; falls back to straight segments. */
export function useGoogleDirections(routePoints, { enabled = true } = {}) {
  const map = useMap();
  const [path, setPath] = useState([]);

  const waypoints = useMemo(
    () => (routePoints || []).map(toLatLng).filter((p) => p && Number.isFinite(p.lat) && Number.isFinite(p.lng)),
    [routePoints],
  );

  useEffect(() => {
    if (!enabled || waypoints.length < 2) {
      setPath(waypoints);
      return undefined;
    }

    let cancelled = false;
    const straight = waypoints;

    const run = async () => {
      if (!window.google?.maps?.DirectionsService) {
        if (!cancelled) setPath(straight);
        return;
      }
      const service = new window.google.maps.DirectionsService();
      const origin = waypoints[0];
      const destination = waypoints[waypoints.length - 1];
      const middle =
        waypoints.length > 2
          ? waypoints.slice(1, -1).map((location) => ({ location, stopover: true }))
          : [];

      service.route(
        {
          origin,
          destination,
          waypoints: middle,
          travelMode: window.google.maps.TravelMode.DRIVING,
          optimizeWaypoints: false,
        },
        (result, status) => {
          if (cancelled) return;
          if (status === window.google.maps.DirectionsStatus.OK && result?.routes?.[0]?.overview_path) {
            setPath(
              result.routes[0].overview_path.map((ll) => ({
                lat: ll.lat(),
                lng: ll.lng(),
              })),
            );
          } else {
            setPath(straight);
          }
        },
      );
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [enabled, map, waypoints]);

  return path;
}

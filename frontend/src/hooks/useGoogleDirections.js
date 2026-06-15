import { useEffect, useMemo, useState } from "react";
import { useMap } from "@vis.gl/react-google-maps";
import { normalizeWaypoints, resolveGoogleRoute } from "@/lib/maps/googleRoute";

/**
 * Road-snapped path via Google Routes / Directions APIs; falls back to straight segments.
 * @deprecated Prefer useRoutePath — kept for internal map layer compatibility.
 */
export function useGoogleDirections(routePoints, { enabled = true } = {}) {
  const map = useMap();
  const waypoints = useMemo(() => normalizeWaypoints(routePoints), [routePoints]);
  const [path, setPath] = useState(waypoints);

  useEffect(() => {
    if (!enabled || waypoints.length < 2) {
      setPath(waypoints);
      return undefined;
    }

    let cancelled = false;
    setPath(waypoints);

    resolveGoogleRoute(waypoints, { allowJsFallback: Boolean(map) }).then((result) => {
      if (!cancelled) setPath(result.path);
    });

    return () => {
      cancelled = true;
    };
  }, [enabled, map, waypoints]);

  return path;
}

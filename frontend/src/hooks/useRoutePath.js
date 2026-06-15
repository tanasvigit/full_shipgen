import { useEffect, useMemo, useState } from "react";
import { normalizeWaypoints, resolveGoogleRoute } from "@/lib/maps/googleRoute";

/**
 * Resolve a Google road-snapped path for stop waypoints.
 *
 * @param {unknown[] | undefined} routePoints Stop waypoints [[lat,lng], ...]
 * @param {{ enabled?: boolean, snapToRoad?: boolean }} [options]
 */
export function useRoutePath(routePoints, { enabled = true, snapToRoad = true } = {}) {
  const waypoints = useMemo(() => normalizeWaypoints(routePoints), [routePoints]);

  const [state, setState] = useState(() => ({
    path: waypoints,
    status: waypoints.length < 2 ? "idle" : snapToRoad ? "loading" : "ok",
    source: "straight",
    error: undefined,
  }));

  useEffect(() => {
    if (!enabled || waypoints.length < 2) {
      setState({
        path: waypoints,
        status: waypoints.length >= 2 ? "ok" : "idle",
        source: "straight",
        error: undefined,
      });
      return undefined;
    }

    if (!snapToRoad) {
      setState({ path: waypoints, status: "ok", source: "straight", error: undefined });
      return undefined;
    }

    let cancelled = false;
    setState((prev) => ({ ...prev, status: "loading" }));

    resolveGoogleRoute(waypoints).then((result) => {
      if (cancelled) return;
      setState({
        path: result.path,
        status: result.status,
        source: result.source,
        error: result.error,
      });
    });

    return () => {
      cancelled = true;
    };
  }, [enabled, snapToRoad, waypoints]);

  return state;
}

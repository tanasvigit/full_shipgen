import { useEffect, useState } from "react";
import type { MapCoordinate } from "@/src/maps/markers";
import { resolveGoogleRoute } from "@/src/maps/googleRoute";

type RouteState = {
  path: MapCoordinate[];
  status: "idle" | "loading" | "ok" | "fallback" | "error";
  source: "google-routes" | "google-directions" | "straight";
  error?: string;
};

function coordinatesKey(waypoints: MapCoordinate[]) {
  return waypoints.map((point) => `${point.latitude},${point.longitude}`).join("|");
}

function pathsEqual(a: MapCoordinate[], b: MapCoordinate[]) {
  if (a.length !== b.length) return false;
  return a.every((point, index) => {
    const other = b[index];
    return point.latitude === other.latitude && point.longitude === other.longitude;
  });
}

/** Resolve a Google road-snapped path for trip stop waypoints. */
export function useGoogleRoutePolyline(waypoints: MapCoordinate[], { enabled = true } = {}) {
  const waypointKey = coordinatesKey(waypoints);

  const [state, setState] = useState<RouteState>(() => ({
    path: waypoints,
    status: waypoints.length < 2 ? "idle" : "loading",
    source: "straight",
  }));

  useEffect(() => {
    if (!enabled || waypoints.length < 2) {
      setState((prev) => {
        const nextStatus = waypoints.length >= 2 ? "ok" : "idle";
        if (pathsEqual(prev.path, waypoints) && prev.status === nextStatus && prev.source === "straight") {
          return prev;
        }
        return {
          path: waypoints,
          status: nextStatus,
          source: "straight",
        };
      });
      return;
    }

    let cancelled = false;
    setState((prev) => (prev.status === "loading" ? prev : { ...prev, status: "loading" }));

    resolveGoogleRoute(waypoints).then((result) => {
      if (cancelled) return;
      setState((prev) => {
        if (
          pathsEqual(prev.path, result.path) &&
          prev.status === result.status &&
          prev.source === result.source &&
          prev.error === ("error" in result ? result.error : undefined)
        ) {
          return prev;
        }
        return {
          path: result.path,
          status: result.status,
          source: result.source,
          error: "error" in result ? result.error : undefined,
        };
      });
    });

    return () => {
      cancelled = true;
    };
  }, [enabled, waypointKey]);

  return state;
}

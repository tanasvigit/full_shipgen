import { forwardRef, useImperativeHandle, useMemo, useRef } from "react";
import { Platform, StyleSheet, View } from "react-native";
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from "react-native-maps";
import StylizedMap from "@/src/components/StylizedMap";
import { defaultRegion, type TripMapMarker } from "@/src/maps/markers";
import { useGoogleRoutePolyline } from "@/src/maps/useGoogleRoutePolyline";
import {
  isNativeMapsSupported,
  mapsProviderLabel,
  markerPinColor,
  shouldUseGoogleMapProvider,
} from "@/src/maps/provider";

const EMPTY_ROUTE: TripMapMarker["coordinate"][] = [];
const EMPTY_GPS_TRAIL: TripMapMarker["coordinate"][] = [];

type TripMapProps = {
  markers: TripMapMarker[];
  /** Ordered stop waypoints (pickup → dropoff) — rendered via Google Routes/Directions. */
  route?: TripMapMarker["coordinate"][];
  /** Live GPS trail points — drawn as-is, not re-routed. */
  gpsTrail?: TripMapMarker["coordinate"][];
  height?: number;
  activeMarkerId?: string;
};

export type TripMapHandle = {
  recenter: () => void;
};

function dedupeTripMarkers(markers: TripMapMarker[]) {
  const seen = new Set<string>();
  return markers.filter((marker) => {
    if (seen.has(marker.id)) return false;
    seen.add(marker.id);
    return true;
  });
}

function stylizedMarkersFromTrip(markers: TripMapMarker[]) {
  if (markers.length === 0) return [];

  const latitudes = markers.map((marker) => marker.coordinate.latitude);
  const longitudes = markers.map((marker) => marker.coordinate.longitude);
  const minLat = Math.min(...latitudes);
  const maxLat = Math.max(...latitudes);
  const minLng = Math.min(...longitudes);
  const maxLng = Math.max(...longitudes);
  const latSpan = Math.max(maxLat - minLat, 0.0001);
  const lngSpan = Math.max(maxLng - minLng, 0.0001);
  const seen = new Map<string, number>();

  return markers.map((marker) => {
    const coordKey = `${marker.coordinate.latitude.toFixed(5)},${marker.coordinate.longitude.toFixed(5)}`;
    const overlap = seen.get(coordKey) ?? 0;
    seen.set(coordKey, overlap + 1);
    const offset = overlap * 0.05;

    return {
      id: marker.id,
      x: Math.min(0.88, 0.12 + ((marker.coordinate.longitude - minLng) / lngSpan) * 0.76 + offset),
      y: Math.min(0.86, 0.14 + (1 - (marker.coordinate.latitude - minLat) / latSpan) * 0.72 - offset),
      color: markerPinColor(marker.kind),
      label: marker.title,
      icon: marker.kind === "driver" ? ("car" as const) : ("flag" as const),
    };
  });
}

function fitMapToMarkers(
  mapRef: MapView | null,
  markers: TripMapMarker[],
  routePath: TripMapMarker["coordinate"][],
  gpsTrail: TripMapMarker["coordinate"][] = [],
) {
  if (!mapRef) return;
  const coordinates = [
    ...markers.map((marker) => marker.coordinate),
    ...routePath,
    ...gpsTrail,
  ];
  if (coordinates.length === 0) return;
  mapRef.fitToCoordinates(coordinates, {
    edgePadding: { top: 40, right: 40, bottom: 40, left: 40 },
    animated: true,
  });
}

const TripMap = forwardRef<TripMapHandle, TripMapProps>(function TripMap(
  { markers, route, gpsTrail, height = 320, activeMarkerId },
  ref
) {
  const mapRef = useRef<MapView | null>(null);
  const normalizedMarkers = useMemo(() => dedupeTripMarkers(markers), [markers]);
  const routeWaypoints = route ?? EMPTY_ROUTE;
  const gpsTrailPoints = gpsTrail ?? EMPTY_GPS_TRAIL;
  const { path: routePath, status: routeStatus } = useGoogleRoutePolyline(routeWaypoints, {
    enabled: routeWaypoints.length >= 2,
  });

  const region = useMemo(() => {
    const points = [...normalizedMarkers.map((m) => m.coordinate), ...routePath, ...gpsTrailPoints];
    return defaultRegion(points);
  }, [gpsTrailPoints, normalizedMarkers, routePath]);

  const stylizedMarkers = useMemo(() => stylizedMarkersFromTrip(normalizedMarkers), [normalizedMarkers]);
  const useGoogleProvider = shouldUseGoogleMapProvider();
  const isFallbackRoute = routeStatus === "fallback" || routeStatus === "straight";

  useImperativeHandle(ref, () => ({
    recenter: () => fitMapToMarkers(mapRef.current, normalizedMarkers, routePath, gpsTrailPoints),
  }));

  if (!isNativeMapsSupported()) {
    return (
      <StylizedMap
        markers={stylizedMarkers}
        height={height}
        attribution={mapsProviderLabel()}
      />
    );
  }

  return (
    <View style={[styles.wrap, { height }]} testID="trip-map">
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={useGoogleProvider ? PROVIDER_GOOGLE : undefined}
        initialRegion={region}
        showsUserLocation={Platform.OS === "ios" && !useGoogleProvider}
        showsMyLocationButton={false}
        onMapReady={() => fitMapToMarkers(mapRef.current, normalizedMarkers, routePath, gpsTrailPoints)}
      >
        {routePath.length > 1 ? (
          <Polyline
            coordinates={routePath}
            strokeColor={isFallbackRoute ? "#64748B" : activeMarkerId ? "#2563EB" : "#0066FF"}
            strokeWidth={4}
            lineDashPattern={isFallbackRoute ? [8, 8] : undefined}
          />
        ) : null}
        {gpsTrailPoints.length > 1 ? (
          <Polyline
            coordinates={gpsTrailPoints}
            strokeColor="#059669"
            strokeWidth={3}
            lineDashPattern={[4, 6]}
          />
        ) : null}
        {normalizedMarkers.map((marker) => (
          <Marker
            key={marker.id}
            coordinate={marker.coordinate}
            title={marker.title}
            description={marker.description}
            pinColor={markerPinColor(marker.kind)}
          />
        ))}
      </MapView>
    </View>
  );
});

export default TripMap;

const styles = StyleSheet.create({
  wrap: { borderRadius: 12, overflow: "hidden", backgroundColor: "#E5E7EB" },
  map: { width: "100%", height: "100%" },
});

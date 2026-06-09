import { useMemo, useRef } from "react";
import { Platform, StyleSheet, View } from "react-native";
import MapView, { Marker, Polyline, PROVIDER_DEFAULT } from "react-native-maps";
import StylizedMap from "@/src/components/StylizedMap";
import { defaultRegion, type TripMapMarker } from "@/src/maps/markers";
import { buildRoutePolyline, snapRoutePreview } from "@/src/maps/polylines";
import { isNativeMapsSupported, markerPinColor } from "@/src/maps/provider";

type TripMapProps = {
  markers: TripMapMarker[];
  route?: TripMapMarker["coordinate"][];
  height?: number;
  activeMarkerId?: string;
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

export default function TripMap({ markers, route = [], height = 320, activeMarkerId }: TripMapProps) {
  const mapRef = useRef<MapView | null>(null);
  const normalizedMarkers = useMemo(() => dedupeTripMarkers(markers), [markers]);

  const region = useMemo(() => {
    const points = [...normalizedMarkers.map((m) => m.coordinate), ...route];
    return defaultRegion(points);
  }, [normalizedMarkers, route]);

  const polyline = useMemo(() => snapRoutePreview(buildRoutePolyline(route)), [route]);
  const stylizedMarkers = useMemo(() => stylizedMarkersFromTrip(normalizedMarkers), [normalizedMarkers]);

  if (!isNativeMapsSupported()) {
    return <StylizedMap markers={stylizedMarkers} height={height} />;
  }

  return (
    <View style={[styles.wrap, { height }]} testID="trip-map">
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={Platform.OS === "android" ? PROVIDER_DEFAULT : undefined}
        initialRegion={region}
        onMapReady={() => {
          if (!mapRef.current || normalizedMarkers.length === 0) return;
          mapRef.current.fitToCoordinates(
            normalizedMarkers.map((marker) => marker.coordinate),
            {
              edgePadding: { top: 40, right: 40, bottom: 40, left: 40 },
              animated: true,
            }
          );
        }}
      >
        {polyline.length > 1 ? (
          <Polyline
            coordinates={polyline}
            strokeColor={activeMarkerId ? "#2563EB" : "#111827"}
            strokeWidth={4}
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
}

const styles = StyleSheet.create({
  wrap: { borderRadius: 12, overflow: "hidden", backgroundColor: "#E5E7EB" },
  map: { width: "100%", height: "100%" },
});

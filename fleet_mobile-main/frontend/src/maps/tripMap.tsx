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

export default function TripMap({ markers, route = [], height = 320, activeMarkerId }: TripMapProps) {
  const mapRef = useRef<MapView | null>(null);

  const region = useMemo(() => {
    const points = [...markers.map((m) => m.coordinate), ...route];
    return defaultRegion(points);
  }, [markers, route]);

  const polyline = useMemo(() => snapRoutePreview(buildRoutePolyline(route)), [route]);

  if (!isNativeMapsSupported()) {
    const stylizedMarkers = markers.map((marker, index) => ({
      id: marker.id,
      x: 0.15 + (index * 0.2) % 0.7,
      y: 0.2 + (index * 0.18) % 0.6,
      color: markerPinColor(marker.kind),
      label: marker.title,
      icon: marker.kind === "driver" ? ("car" as const) : ("flag" as const),
    }));
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
          if (!mapRef.current || markers.length === 0) return;
          mapRef.current.fitToCoordinates(
            markers.map((marker) => marker.coordinate),
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
        {markers.map((marker) => (
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

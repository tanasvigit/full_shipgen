import { Map, Polyline, Circle } from "@vis.gl/react-google-maps";
import { MapLoader } from "@/components/loaders/indicators/LoadingIndicators";
import { DEFAULT_MAP_CENTER, DEFAULT_MAP_ZOOM } from "@/lib/maps/googleConfig";
import { useGoogleDirections } from "@/hooks/useGoogleDirections";
import GoogleMapMarker from "@/components/maps/GoogleMapMarker";
import GoogleMapBounds from "@/components/maps/GoogleMapBounds";

function DirectionsLayer({ routePoints, useDirections }) {
  const path = useGoogleDirections(routePoints, { enabled: useDirections });
  if (!path || path.length < 2) return null;
  return (
    <Polyline
      path={path}
      strokeColor="#0066FF"
      strokeOpacity={0.9}
      strokeWeight={4}
    />
  );
}

export default function GoogleMapView({
  markers = [],
  routePoints,
  routeTrails = [],
  center,
  zoom = DEFAULT_MAP_ZOOM,
  geofence,
  height = "100%",
  className = "",
  testid = "map-view",
  fitOnce = false,
  loading = false,
  onMarkerClick,
  onMarkerContextMenu,
  selectedMarkerId = null,
  useDirections = true,
}) {
  const defaultCenter = center
    ? { lat: Array.isArray(center) ? center[0] : center.lat, lng: Array.isArray(center) ? center[1] : center.lng }
    : markers[0]
      ? { lat: markers[0].lat, lng: markers[0].lng }
      : DEFAULT_MAP_CENTER;

  return (
    <div
      data-testid={testid}
      data-map-provider="google"
      className={`relative rounded-lg overflow-hidden border border-black/[0.06] ${className}`}
      style={{ height }}
      aria-busy={loading}
    >
      <Map
        defaultCenter={defaultCenter}
        defaultZoom={zoom}
        gestureHandling="greedy"
        disableDefaultUI={false}
        fullscreenControl
        mapTypeControl
        streetViewControl
        style={{ width: "100%", height: "100%" }}
      >
        <GoogleMapBounds
          markers={markers}
          routePoints={routePoints}
          routeTrails={routeTrails}
          geofence={geofence}
          zoom={zoom}
          fitOnce={fitOnce}
        />

        {markers.map((m) => (
          <GoogleMapMarker
            key={m.id ?? `${m.lat}-${m.lng}`}
            marker={m}
            selected={selectedMarkerId && String(m.id) === String(selectedMarkerId)}
            onMarkerClick={onMarkerClick}
            onMarkerContextMenu={onMarkerContextMenu}
          />
        ))}

        {routePoints && routePoints.length > 1 ? (
          <DirectionsLayer routePoints={routePoints} useDirections={useDirections} />
        ) : null}

        {(routeTrails || []).map((trail, idx) => {
          if (!trail?.points || trail.points.length < 2) return null;
          const path = trail.points.map((p) =>
            Array.isArray(p) ? { lat: p[0], lng: p[1] } : { lat: p.lat, lng: p.lng },
          );
          return (
            <Polyline
              key={trail.id || `trail-${idx}`}
              path={path}
              strokeColor={trail.color || "#059669"}
              strokeOpacity={trail.highlighted ? 0.95 : 0.5}
              strokeWeight={trail.highlighted ? 4 : 2}
            />
          );
        })}

        {geofence?.lat != null && geofence?.lng != null ? (
          <Circle
            center={{ lat: geofence.lat, lng: geofence.lng }}
            radius={geofence.radius || 500}
            strokeColor="#16A34A"
            strokeOpacity={0.8}
            strokeWeight={1}
            fillColor="#16A34A"
            fillOpacity={0.12}
          />
        ) : null}
      </Map>
      {loading && <MapLoader />}
    </div>
  );
}

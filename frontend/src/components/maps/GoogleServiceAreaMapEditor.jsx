import { useCallback, useEffect, useState } from "react";
import { Map, Polygon, useMap } from "@vis.gl/react-google-maps";
import { Button } from "@/components/ui/button";
import { DEFAULT_MAP_CENTER, DEFAULT_MAP_ZOOM } from "@/lib/maps/googleConfig";
import { isValidPolygon, toGeoJsonPolygon, toLeafletPolygon } from "@/lib/fleetops/geofence";

const DEFAULT_HINT =
  "Click the map to place boundary points. Minimum 3 points required.";
const EMBEDDED_HINT =
  "Click the map to draw the zone boundary. It is included when you create or save the zone.";

function MapClickHandler({ onPoint }) {
  const map = useMap();
  useEffect(() => {
    if (!map) return undefined;
    const listener = map.addListener("click", (event) => {
      onPoint([event.latLng.lat(), event.latLng.lng()]);
    });
    return () => listener.remove();
  }, [map, onPoint]);
  return null;
}

function PointMarkers({ points }) {
  const map = useMap();
  useEffect(() => {
    if (!map || !window.google?.maps) return undefined;
    const markers = points.map(([lat, lng]) => {
      const marker = new window.google.maps.Marker({
        position: { lat, lng },
        map,
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 5,
          fillColor: "#0066FF",
          fillOpacity: 0.85,
          strokeColor: "#0066FF",
          strokeWeight: 1,
        },
      });
      return marker;
    });
    return () => markers.forEach((marker) => marker.setMap(null));
  }, [map, points]);
  return null;
}

function FitPolygonBounds({ points }) {
  const map = useMap();
  useEffect(() => {
    if (!map || !window.google?.maps || points.length < 3) return;
    const bounds = new window.google.maps.LatLngBounds();
    points.forEach(([lat, lng]) => bounds.extend({ lat, lng }));
    map.fitBounds(bounds, 40);
  }, [map, points]);
  return null;
}

export default function GoogleServiceAreaMapEditor({
  geometry,
  onSave,
  onDelete,
  onChange,
  autoSync = false,
  busy = false,
  saveLabel = "Save boundary",
  deleteLabel = "Delete boundary",
  showSaveButton,
  showDeleteButton,
  hint,
}) {
  const [points, setPoints] = useState(() => toLeafletPolygon(geometry));
  const shouldShowSave = showSaveButton ?? !autoSync;
  const shouldShowDelete = showDeleteButton ?? (!autoSync && Boolean(onDelete));
  const hintText = hint ?? (autoSync ? EMBEDDED_HINT : DEFAULT_HINT);

  useEffect(() => {
    setPoints(toLeafletPolygon(geometry));
  }, [geometry]);

  useEffect(() => {
    if (!autoSync || !onChange) return;
    if (isValidPolygon(points)) {
      onChange(toGeoJsonPolygon(points));
    } else if (points.length === 0) {
      onChange(null);
    }
  }, [points, autoSync, onChange]);

  const addPoint = useCallback((point) => {
    setPoints((prev) => [...prev, point]);
  }, []);

  const save = () => {
    const polygon = toGeoJsonPolygon(points);
    onSave?.(polygon);
  };

  const polygonPath =
    points.length >= 3 ? points.map(([lat, lng]) => ({ lat, lng })) : [];

  const mapCenter =
    points.length > 0
      ? { lat: points[points.length - 1][0], lng: points[points.length - 1][1] }
      : DEFAULT_MAP_CENTER;

  return (
    <div className="space-y-3" data-testid="service-area-map-editor">
      <div className="flex items-center justify-between">
        <p className="text-xs text-[#4B5563]" data-testid="service-area-map-hint">
          {hintText}
        </p>
        <div className="text-xs font-mono text-[#6B7280]" data-testid="service-area-points-count">
          {points.length} pts
        </div>
      </div>
      <div
        className="h-[340px] rounded-lg border border-black/[0.08] overflow-hidden"
        data-testid="service-area-map-canvas"
      >
        <Map
          defaultCenter={mapCenter}
          defaultZoom={DEFAULT_MAP_ZOOM}
          gestureHandling="greedy"
          disableDefaultUI={false}
          style={{ width: "100%", height: "100%" }}
        >
          <MapClickHandler onPoint={addPoint} />
          <PointMarkers points={points} />
          {polygonPath.length >= 3 ? (
            <>
              <Polygon
                paths={polygonPath}
                strokeColor="#0066FF"
                strokeOpacity={0.9}
                strokeWeight={2}
                fillColor="#0066FF"
                fillOpacity={0.15}
              />
              <FitPolygonBounds points={points} />
            </>
          ) : null}
        </Map>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          onClick={() => setPoints((prev) => prev.slice(0, -1))}
          disabled={busy || points.length === 0}
          data-testid="service-area-map-undo"
        >
          Undo point
        </Button>
        <Button
          variant="outline"
          onClick={() => setPoints([])}
          disabled={busy || points.length === 0}
          data-testid="service-area-map-clear"
        >
          Clear
        </Button>
        {shouldShowSave ? (
          <Button onClick={save} disabled={busy || !isValidPolygon(points)} data-testid="service-area-map-save">
            {saveLabel}
          </Button>
        ) : null}
        {shouldShowDelete ? (
          <Button
            variant="destructive"
            onClick={() => onDelete?.()}
            disabled={busy}
            data-testid="service-area-map-delete"
          >
            {deleteLabel}
          </Button>
        ) : null}
      </div>
    </div>
  );
}

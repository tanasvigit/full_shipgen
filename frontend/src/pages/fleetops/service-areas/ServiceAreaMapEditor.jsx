import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import { Button } from "@/components/ui/button";
import { isValidPolygon, toGeoJsonPolygon, toLeafletPolygon } from "@/lib/fleetops/geofence";

export default function ServiceAreaMapEditor({ geometry, onSave, onDelete, busy = false }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const layerRef = useRef(null);
  const [points, setPoints] = useState(() => toLeafletPolygon(geometry));

  useEffect(() => {
    setPoints(toLeafletPolygon(geometry));
  }, [geometry]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = L.map(containerRef.current, {
      center: [40.7128, -74.006],
      zoom: 11,
      zoomControl: true,
      attributionControl: true,
    });
    L.tileLayer("https://cartodb-basemaps-{s}.global.ssl.fastly.net/light_all/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap, © CARTO",
      subdomains: "abcd",
      maxZoom: 19,
    }).addTo(map);
    mapRef.current = map;
    layerRef.current = L.layerGroup().addTo(map);
    map.on("click", (e) => {
      setPoints((prev) => [...prev, [e.latlng.lat, e.latlng.lng]]);
    });
    setTimeout(() => map.invalidateSize(), 50);
    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    const layer = layerRef.current;
    if (!map || !layer) return;
    layer.clearLayers();
    points.forEach((point) => {
      L.circleMarker(point, {
        radius: 5,
        color: "#0066FF",
        fillColor: "#0066FF",
        fillOpacity: 0.85,
      }).addTo(layer);
    });
    if (points.length >= 3) {
      const polygon = L.polygon(points, {
        color: "#0066FF",
        fillColor: "#0066FF",
        fillOpacity: 0.15,
      }).addTo(layer);
      map.fitBounds(polygon.getBounds(), { padding: [24, 24], maxZoom: 14 });
    } else if (points.length > 0) {
      map.setView(points[points.length - 1], 13);
    }
    setTimeout(() => map.invalidateSize(), 25);
  }, [points]);

  const save = () => {
    const polygon = toGeoJsonPolygon(points);
    onSave?.(polygon);
  };

  return (
    <div className="space-y-3" data-testid="service-area-map-editor">
      <div className="flex items-center justify-between">
        <p className="text-xs text-[#4B5563]" data-testid="service-area-map-hint">
          Click map to draw polygon points. Minimum 3 points required.
        </p>
        <div className="text-xs font-mono text-[#6B7280]" data-testid="service-area-points-count">
          {points.length} pts
        </div>
      </div>
      <div
        ref={containerRef}
        className="h-[340px] rounded-lg border border-black/[0.08]"
        data-testid="service-area-map-canvas"
      />
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
        <Button
          onClick={save}
          disabled={busy || !isValidPolygon(points)}
          data-testid="service-area-map-save"
        >
          Save polygon
        </Button>
        <Button
          variant="destructive"
          onClick={() => onDelete?.()}
          disabled={busy}
          data-testid="service-area-map-delete"
        >
          Delete polygon
        </Button>
      </div>
    </div>
  );
}

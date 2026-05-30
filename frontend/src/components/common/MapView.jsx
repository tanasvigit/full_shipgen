import { useEffect, useRef } from "react";
import L from "leaflet";
import { MapLoader } from "@/components/loaders/indicators/LoadingIndicators";

/**
 * Generic dark-themed Leaflet map.
 * markers: [{ id, lat, lng, label?, color?, popup? }]
 * routePoints: array of [lat, lng] pairs for a polyline
 */
export default function MapView({
    markers = [],
    routePoints,
    routeTrails = [],
    center,
    zoom = 12,
    geofence,
    height = "100%",
    className = "",
    testid = "map-view",
    fitOnce = false,
    loading = false,
    onMarkerClick,
    selectedMarkerId = null,
}) {
    const containerRef = useRef(null);
    const mapRef = useRef(null);
    const layerRef = useRef(null);
    const hasFitRef = useRef(false);

    useEffect(() => {
        if (!containerRef.current || mapRef.current) return;
        const fallback = markers[0]
            ? [markers[0].lat, markers[0].lng]
            : center || [40.7128, -74.006];
        const map = L.map(containerRef.current, {
            center: fallback,
            zoom,
            zoomControl: true,
            attributionControl: true,
        });
        L.tileLayer(
            "https://cartodb-basemaps-{s}.global.ssl.fastly.net/light_all/{z}/{x}/{y}.png",
            {
                attribution: "© OpenStreetMap, © CARTO",
                subdomains: "abcd",
                maxZoom: 19,
            },
        ).addTo(map);
        mapRef.current = map;
        layerRef.current = L.layerGroup().addTo(map);
        // Refresh sizing once visible
        setTimeout(() => map.invalidateSize(), 50);
        return () => {
            map.remove();
            mapRef.current = null;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        const map = mapRef.current;
        const layer = layerRef.current;
        if (!map || !layer) return;
        layer.clearLayers();

        const bounds = [];

        markers.forEach((m) => {
            const color = m.color || "#0066FF";
            const selected = selectedMarkerId && String(m.id) === String(selectedMarkerId);
            const live = m.live;
            const pulse = live
                ? `@keyframes fb-pulse{0%,100%{transform:scale(1);opacity:.55}50%{transform:scale(1.35);opacity:.2}}`
                : "";
            const html = `
                <style>${pulse}</style>
                <div style="position:relative;display:flex;align-items:center;justify-content:center;">
                  <span style="position:absolute;width:${selected ? 36 : 28}px;height:${selected ? 36 : 28}px;border-radius:9999px;background:${color}${selected ? "33" : "22"};border:2px solid ${color}${selected ? "" : "55"};${live ? "animation:fb-pulse 2s ease-in-out infinite;" : ""}"></span>
                  <span style="position:relative;width:${selected ? 14 : 12}px;height:${selected ? 14 : 12}px;border-radius:9999px;background:${color};box-shadow:0 0 0 ${selected ? 3 : 2}px #ffffff;"></span>
                </div>`;
            const icon = L.divIcon({ html, className: "fb-marker", iconSize: [28, 28] });
            const marker = L.marker([m.lat, m.lng], { icon }).addTo(layer);
            if (onMarkerClick) {
                marker.on("click", () => onMarkerClick(m));
            }
            if (m.popup || m.label) {
                marker.bindPopup(
                    `<div style="font-family:'IBM Plex Sans',sans-serif;color:#0A0E1A;font-size:12px;">
                        <div style="font-weight:600;margin-bottom:2px;">${m.label || ""}</div>
                        ${m.popup ? `<div style="color:#6B7280;">${m.popup}</div>` : ""}
                    </div>`,
                );
            }
            bounds.push([m.lat, m.lng]);
        });

        if (routePoints && routePoints.length > 1) {
            L.polyline(routePoints, {
                color: "#0066FF",
                weight: 3,
                opacity: 0.9,
                dashArray: "6, 6",
            }).addTo(layer);
            routePoints.forEach((p) => bounds.push(p));
        }

        (routeTrails || []).forEach((trail, idx) => {
            if (!trail?.points || trail.points.length < 2) return;
            L.polyline(trail.points, {
                color: trail.color || "#059669",
                weight: trail.highlighted ? 4 : 2,
                opacity: trail.highlighted ? 0.95 : 0.5,
            }).addTo(layer);
            trail.points.forEach((p) => bounds.push(p));
        });

        if (geofence) {
            L.circle([geofence.lat, geofence.lng], {
                radius: geofence.radius || 500,
                color: "#16A34A",
                weight: 1,
                fillColor: "#16A34A",
                fillOpacity: 0.1,
            }).addTo(layer);
            bounds.push([geofence.lat, geofence.lng]);
        }

        if (bounds.length === 1) {
            if (!fitOnce || !hasFitRef.current) {
                map.setView(bounds[0], zoom);
                hasFitRef.current = true;
            }
        } else if (bounds.length > 1) {
            if (!fitOnce || !hasFitRef.current) {
                map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
                hasFitRef.current = true;
            }
        }
        setTimeout(() => map.invalidateSize(), 50);
    }, [markers, routePoints, routeTrails, geofence, zoom, fitOnce, onMarkerClick, selectedMarkerId]);

    return (
        <div
            data-testid={testid}
            className={`relative rounded-lg overflow-hidden border border-black/[0.06] ${className}`}
            style={{ height }}
            aria-busy={loading}
        >
            <div ref={containerRef} className="absolute inset-0 z-0" />
            {loading && <MapLoader />}
        </div>
    );
}

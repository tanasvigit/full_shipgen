import { useEffect, useRef } from "react";
import { useMap } from "@vis.gl/react-google-maps";

export default function GoogleMapBounds({ markers = [], routePoints = [], routeTrails = [], geofence, zoom = 12, fitOnce = false }) {
  const map = useMap();
  const hasFitRef = useRef(false);

  useEffect(() => {
    if (!map || !window.google?.maps) return;
    if (fitOnce && hasFitRef.current) return;

    const bounds = new window.google.maps.LatLngBounds();
    let count = 0;

    markers.forEach((m) => {
      if (Number.isFinite(m.lat) && Number.isFinite(m.lng)) {
        bounds.extend({ lat: m.lat, lng: m.lng });
        count += 1;
      }
    });
    (routePoints || []).forEach((p) => {
      const lat = Array.isArray(p) ? p[0] : p.lat;
      const lng = Array.isArray(p) ? p[1] : p.lng;
      if (Number.isFinite(lat) && Number.isFinite(lng)) {
        bounds.extend({ lat, lng });
        count += 1;
      }
    });
    (routeTrails || []).forEach((trail) => {
      (trail?.points || []).forEach((p) => {
        const lat = Array.isArray(p) ? p[0] : p.lat;
        const lng = Array.isArray(p) ? p[1] : p.lng;
        if (Number.isFinite(lat) && Number.isFinite(lng)) {
          bounds.extend({ lat, lng });
          count += 1;
        }
      });
    });
    if (geofence?.lat != null && geofence?.lng != null) {
      bounds.extend({ lat: geofence.lat, lng: geofence.lng });
      count += 1;
    }

    if (count === 0) return;
    if (count === 1) {
      map.setCenter(bounds.getCenter());
      map.setZoom(zoom);
    } else {
      map.fitBounds(bounds, 40);
    }
    if (fitOnce) hasFitRef.current = true;
  }, [map, markers, routePoints, routeTrails, geofence, zoom, fitOnce]);

  return null;
}

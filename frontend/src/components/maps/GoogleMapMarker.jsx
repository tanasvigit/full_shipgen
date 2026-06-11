import { useEffect } from "react";
import { useMap } from "@vis.gl/react-google-maps";

export default function GoogleMapMarker({ marker, selected, onMarkerClick, onMarkerContextMenu }) {
  const map = useMap();
  const color = marker.color || "#0066FF";

  useEffect(() => {
    if (!map || !window.google?.maps) return undefined;

    const gMarker = new window.google.maps.Marker({
      position: { lat: Number(marker.lat), lng: Number(marker.lng) },
      map,
      title: marker.label || "",
      icon: {
        path: window.google.maps.SymbolPath.CIRCLE,
        scale: selected ? 9 : 7,
        fillColor: color,
        fillOpacity: 1,
        strokeColor: "#ffffff",
        strokeWeight: selected ? 3 : 2,
      },
      zIndex: selected ? 2 : 1,
    });

    const listeners = [];
    let infoWindow = null;
    if (marker.popup || marker.label) {
      infoWindow = new window.google.maps.InfoWindow({
        content: `<div style="font-family:IBM Plex Sans,sans-serif;font-size:12px;color:#0A0E1A;">
          <div style="font-weight:600;margin-bottom:2px;">${marker.label || ""}</div>
          ${marker.popup ? `<div style="color:#6B7280;">${marker.popup}</div>` : ""}
        </div>`,
      });
    }
    listeners.push(
      gMarker.addListener("click", () => {
        onMarkerClick?.(marker);
        if (infoWindow) infoWindow.open({ map, anchor: gMarker });
      }),
    );
    if (onMarkerContextMenu) {
      listeners.push(
        gMarker.addListener("rightclick", (event) => {
          onMarkerContextMenu(marker, event);
        }),
      );
    }

    return () => {
      listeners.forEach((listener) => listener.remove());
      gMarker.setMap(null);
    };
  }, [map, marker, selected, color, onMarkerClick, onMarkerContextMenu]);

  return null;
}

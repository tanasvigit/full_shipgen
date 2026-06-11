import LeafletMapView from "@/components/maps/LeafletMapView";
import GoogleMapView from "@/components/maps/GoogleMapView";
import { isGoogleMapsEnabled } from "@/lib/maps/googleConfig";

/**
 * Fleet console map — Google Maps when VITE_GOOGLE_MAPS_API_KEY is set, otherwise Leaflet tiles.
 *
 * markers: [{ id, lat, lng, label?, color?, popup?, live? }]
 * routePoints: [[lat, lng], ...] — rendered with Google Directions when available
 * routeTrails: [{ points, color?, highlighted? }]
 */
export default function MapView(props) {
  if (isGoogleMapsEnabled()) {
    return <GoogleMapView {...props} />;
  }
  return <LeafletMapView {...props} />;
}

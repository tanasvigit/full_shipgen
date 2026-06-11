import { APIProvider } from "@vis.gl/react-google-maps";
import { getGoogleMapsApiKey, GOOGLE_MAPS_LIBRARIES, isGoogleMapsEnabled } from "@/lib/maps/googleConfig";

export default function GoogleMapsProvider({ children }) {
  const apiKey = getGoogleMapsApiKey();
  if (!isGoogleMapsEnabled()) {
    return children;
  }
  return (
    <APIProvider apiKey={apiKey} libraries={GOOGLE_MAPS_LIBRARIES} version="weekly">
      {children}
    </APIProvider>
  );
}

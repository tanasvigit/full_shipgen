import { isGoogleMapsEnabled } from "@/lib/maps/googleConfig";
import { parseGooglePlace } from "@/lib/maps/parseGooglePlace";

function geocoderResultToFields(result) {
  if (!result) return null;
  return parseGooglePlace({
    address_components: result.address_components,
    geometry: result.geometry,
    formatted_address: result.formatted_address,
    name: result.formatted_address,
  });
}

/** Forward geocode an address string via the Google Geocoding API (client-side). */
export function geocodeAddressWithGoogle(query) {
  if (!isGoogleMapsEnabled() || !query?.trim() || !window.google?.maps?.Geocoder) {
    return Promise.resolve(null);
  }
  const geocoder = new window.google.maps.Geocoder();
  return new Promise((resolve) => {
    geocoder.geocode({ address: query.trim() }, (results, status) => {
      if (status === window.google.maps.GeocoderStatus.OK && results?.[0]) {
        resolve(geocoderResultToFields(results[0]));
      } else {
        resolve(null);
      }
    });
  });
}

/** Reverse geocode coordinates via the Google Geocoding API (client-side). */
export function reverseGeocodeWithGoogle(lat, lng) {
  if (!isGoogleMapsEnabled() || !window.google?.maps?.Geocoder) {
    return Promise.resolve(null);
  }
  const geocoder = new window.google.maps.Geocoder();
  return new Promise((resolve) => {
    geocoder.geocode({ location: { lat: Number(lat), lng: Number(lng) } }, (results, status) => {
      if (status === window.google.maps.GeocoderStatus.OK && results?.[0]) {
        resolve(geocoderResultToFields(results[0]));
      } else {
        resolve(null);
      }
    });
  });
}

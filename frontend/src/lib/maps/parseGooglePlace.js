/** Normalize a Google Places `place` result into Fleetbase place form fields. */

function component(components, type, useShort = false) {
  const match = (components || []).find((c) => c.types?.includes(type));
  if (!match) return "";
  return useShort ? match.short_name || match.long_name || "" : match.long_name || match.short_name || "";
}

export function parseGooglePlace(place) {
  if (!place) return null;
  const components = place.address_components || [];
  const location = place.geometry?.location;
  const lat = typeof location?.lat === "function" ? location.lat() : location?.lat;
  const lng = typeof location?.lng === "function" ? location.lng() : location?.lng;

  const streetNumber = component(components, "street_number");
  const route = component(components, "route");
  const street1 = [streetNumber, route].filter(Boolean).join(" ").trim() || place.name || "";

  return {
    name: place.name || street1 || place.formatted_address || "",
    street1,
    street2: "",
    city:
      component(components, "locality") ||
      component(components, "postal_town") ||
      component(components, "sublocality"),
    province: component(components, "administrative_area_level_1"),
    postalCode: component(components, "postal_code"),
    country: component(components, "country", true).toUpperCase(),
    latitude: lat != null ? String(lat) : "",
    longitude: lng != null ? String(lng) : "",
    formattedAddress: place.formatted_address || "",
  };
}

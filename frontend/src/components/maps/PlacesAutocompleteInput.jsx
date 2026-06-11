import { useEffect, useRef } from "react";
import { useMapsLibrary } from "@vis.gl/react-google-maps";
import { Input } from "@/components/ui/input";
import { isGoogleMapsEnabled } from "@/lib/maps/googleConfig";

function syncPacDropdownLayer() {
  document.querySelectorAll(".pac-container").forEach((container) => {
    container.style.pointerEvents = "auto";
    container.style.zIndex = "10050";
  });
}

/**
 * Google Places Autocomplete search input.
 * Falls back to a plain text field when the Maps API key is not configured.
 */
export default function PlacesAutocompleteInput({
  onPlaceSelect,
  placeholder = "Search for an address or place…",
  className = "",
  testId = "places-autocomplete",
  defaultValue = "",
}) {
  const inputRef = useRef(null);
  const places = useMapsLibrary("places");

  useEffect(() => {
    if (!isGoogleMapsEnabled() || !places || !inputRef.current) return undefined;

    const autocomplete = new places.Autocomplete(inputRef.current, {
      fields: ["address_components", "geometry", "formatted_address", "name", "place_id"],
    });

    const listener = autocomplete.addListener("place_changed", () => {
      const place = autocomplete.getPlace();
      if (place) onPlaceSelect?.(place);
    });

    const observer = new MutationObserver(syncPacDropdownLayer);
    observer.observe(document.body, { childList: true, subtree: true });
    syncPacDropdownLayer();

    return () => {
      listener.remove();
      observer.disconnect();
      window.google?.maps?.event?.clearInstanceListeners(autocomplete);
    };
  }, [places, onPlaceSelect]);

  return (
    <Input
      ref={inputRef}
      defaultValue={defaultValue}
      placeholder={placeholder}
      className={className}
      data-testid={testId}
      autoComplete="off"
    />
  );
}

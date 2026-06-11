/** Google Places Autocomplete renders `.pac-container` on `document.body`, outside Radix dialogs. */

export function isGooglePlacesDropdownTarget(target) {
  return target instanceof Element && Boolean(target.closest(".pac-container"));
}

export function isGooglePlacesDropdownEvent(event) {
  return isGooglePlacesDropdownTarget(event.target);
}

/** Allow mouse hover/click on Places suggestions inside modal dialogs. */
export const radixPlacesAutocompleteOutsideProps = {
  onPointerDownOutside: (event) => {
    if (isGooglePlacesDropdownEvent(event)) event.preventDefault();
  },
  onInteractOutside: (event) => {
    if (isGooglePlacesDropdownEvent(event)) event.preventDefault();
  },
  onFocusOutside: (event) => {
    if (isGooglePlacesDropdownEvent(event)) event.preventDefault();
  },
};

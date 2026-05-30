/**
 * Stacking order for overlays. FleetOps form modals use z-[100]; popovers must sit above.
 */
export const Z_INDEX = {
  drawer: "z-50",
  modalOverlay: "z-[99]",
  modal: "z-[100]",
  /** Select, dropdown-menu, popover — above FleetOps modals */
  popover: "z-[110]",
  alert: "z-[110]",
};

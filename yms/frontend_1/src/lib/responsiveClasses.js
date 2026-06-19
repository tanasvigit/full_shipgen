/** Shared responsive Tailwind class strings for YARD.OS */

export const PAGE_PADDING = "p-4 sm:p-5 md:p-6 space-y-4";

/** Dense KPI strips (8 metrics) — 1 col mobile → 8 cols at 2xl */
export const KPI_GRID_DENSE =
  "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 2xl:grid-cols-8 gap-3";

/** Standard KPI row (6 metrics) */
export const KPI_GRID_STANDARD =
  "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3";

/** Entity drawer / sheet — full width on mobile */
export const DRAWER_SHEET =
  "w-full max-w-[100vw] sm:max-w-md md:max-w-lg overflow-y-auto thin-scroll max-h-[100dvh] flex flex-col";

export const TOUCH_BTN =
  "min-h-[44px] min-w-[44px] inline-flex items-center justify-center";

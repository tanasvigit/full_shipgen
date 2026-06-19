/** Public URL paths for ShipGen / YARD.OS brand assets (see public/brand/). */

function publicAsset(assetPath) {
  const base = (process.env.PUBLIC_URL || "").replace(/\/$/, "");
  const path = assetPath.startsWith("/") ? assetPath : `/${assetPath}`;
  return `${base}${path}`;
}

export const BRAND_LOGO_FULL = publicAsset("/brand/shipgen-logo-full.png");
export const BRAND_LOGO_ICON = publicAsset("/brand/shipgen-icon.png");
export const BRAND_FAVICON_16 = publicAsset("/brand/favicon-16.png");
export const BRAND_FAVICON_32 = publicAsset("/brand/favicon-32.png");
export const BRAND_APPLE_TOUCH = publicAsset("/brand/favicon-180.png");

export const BRAND_PRODUCT_NAME = "YARD.OS";
export const BRAND_PRODUCT_TAGLINE = "Smart Yard Management System";
export const BRAND_DOCUMENT_TITLE = "YARD.OS – Smart Yard Management System";

/** Aspect ratio of shipgen-logo-full.png (width / height). */
export const BRAND_LOGO_FULL_ASPECT = 598 / 190;

import React from "react";
import {
  BRAND_LOGO_FULL,
  BRAND_LOGO_ICON,
  BRAND_LOGO_FULL_ASPECT,
} from "../../constants/brandPaths";

const HEIGHT_PX = 30;

/**
 * ShipGen brand mark for YARD.OS.
 * @param {"icon"|"full"|"responsive"} variant
 *   icon — square mark only
 *   full — horizontal wordmark
 *   responsive — icon on mobile, full wordmark on md+
 */
export const BrandLogo = ({
  variant = "full",
  className = "",
  imgClassName = "",
  height = HEIGHT_PX,
}) => {
  const fullMaxWidth = Math.round(height * BRAND_LOGO_FULL_ASPECT);
  const fullStyle = { height, width: "auto", maxWidth: fullMaxWidth };

  if (variant === "icon") {
    return (
      <img
        src={BRAND_LOGO_ICON}
        alt="ShipGen"
        className={`object-contain ${imgClassName} ${className}`}
        style={{ height, width: height, maxWidth: height }}
        decoding="async"
      />
    );
  }

  if (variant === "full") {
    return (
      <img
        src={BRAND_LOGO_FULL}
        alt="ShipGen"
        className={`object-contain object-left ${imgClassName} ${className}`}
        style={fullStyle}
        decoding="async"
      />
    );
  }

  return (
    <span className={`inline-flex items-center ${className}`}>
      <img
        src={BRAND_LOGO_ICON}
        alt="ShipGen"
        className={`object-contain md:hidden ${imgClassName}`}
        style={{ height, width: height, maxWidth: height }}
        decoding="async"
      />
      <img
        src={BRAND_LOGO_FULL}
        alt="ShipGen"
        className={`hidden md:block object-contain object-left ${imgClassName}`}
        style={fullStyle}
        decoding="async"
      />
    </span>
  );
};

export default BrandLogo;

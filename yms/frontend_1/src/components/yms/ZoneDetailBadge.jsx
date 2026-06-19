import React from "react";
import { isMapLayoutZone, resolveMapCode } from "../../utils/zoneDisplay";

const SIZE_CLASSES = {
  sm: "w-12 h-12",
  md: "w-14 h-14",
};

/**
 * Zone badge for map layout zones (A–F) only.
 * Operational flow zones render no decorative artwork — data fields only.
 */
export const ZoneDetailBadge = ({ zone, size = "md", className = "" }) => {
  const color = zone?.color || "#64748B";
  const box = SIZE_CLASSES[size] || SIZE_CLASSES.md;
  const mapCode = resolveMapCode(zone);

  if (!isMapLayoutZone(zone) || !mapCode) {
    return null;
  }

  return (
    <div
      data-testid="zone-detail-badge-map"
      className={`flex items-center justify-center ${box} mx-auto rounded-md font-display font-black text-2xl text-white ${className}`}
      style={{ background: color }}
      aria-hidden
    >
      {mapCode}
    </div>
  );
};

export default ZoneDetailBadge;

import { memo } from "react";
import { cn } from "@/lib/utils";
import "./spinner.css";

/** viewBox 50×50, r=20 → circumference ≈ 125.66; arc ≈ 94 (~75%) for consistent gap */
const ARC_LENGTH = 94;
const CIRCUMFERENCE = 125.66;

const SIZES = {
  xs: 14,
  sm: 18,
  md: 24,
  lg: 32,
  xl: 48,
};

/**
 * Enterprise arc spinner — SVG stroke arc, rounded cap, seamless CSS rotation.
 * @param {{ size?: keyof typeof SIZES | number, label?: string, className?: string, testId?: string }} props
 */
function ArcSpinner({ size = "md", label, className, testId = "arc-spinner" }) {
  const px = typeof size === "number" ? size : SIZES[size] ?? SIZES.md;

  return (
    <span
      className={cn("fleetbase-arc-spinner-host fleetbase-loader-fade-in", className)}
      style={{ width: px, height: px }}
      role={label ? "status" : undefined}
      aria-hidden={!label}
      aria-label={label}
    >
      <svg
        className="fleetbase-arc-spinner"
        width={px}
        height={px}
        viewBox="0 0 50 50"
        aria-hidden={!label}
        data-testid={testId}
      >
        <circle
          className="fleetbase-arc-spinner__track"
          cx="25"
          cy="25"
          r="20"
          fill="none"
          strokeWidth="4"
        />
        <circle
          className="fleetbase-arc-spinner__arc"
          cx="25"
          cy="25"
          r="20"
          fill="none"
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={`${ARC_LENGTH} ${CIRCUMFERENCE}`}
          transform="rotate(-90 25 25)"
        />
      </svg>
    </span>
  );
}

export default memo(ArcSpinner);

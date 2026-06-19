import { memo } from "react";
import { cn } from "@/lib/utils";
import "./spinner.css";

const SIZES = {
  xs: 28,
  sm: 38,
  md: 52,
  lg: 72,
  xl: 96,
};

const LOGO_SRC = "/logo.png";

/** ShipGen logo loader — orange streaks + blue swoosh slide (replaces arc spinner). */
function LogoLoader({ size = "md", label, className, testId = "logo-loader" }) {
  const height = typeof size === "number" ? size : SIZES[size] ?? SIZES.md;
  const width = Math.round(height * 1.62);

  return (
    <span
      className={cn("fleetbase-logo-loader-host fleetbase-loader-fade-in", className)}
      style={{ width, height }}
      role={label ? "status" : undefined}
      aria-hidden={!label}
      aria-label={label}
    >
      <svg
        className="fleetbase-logo-loader"
        width={width}
        height={height}
        viewBox="0 0 512 320"
        aria-hidden={!label}
        data-testid={testId}
      >
        <defs>
          <clipPath id="fleetbase-logo-streaks-clip">
            <rect x="4" y="68" width="228" height="132" rx="4" />
          </clipPath>
          <clipPath id="fleetbase-logo-swoosh-clip">
            <path d="M0 198 L512 198 L512 320 L0 320 Z" />
          </clipPath>
          <clipPath id="fleetbase-logo-mark-clip">
            <path d="M188 8 L512 8 L512 210 L188 210 Z" />
          </clipPath>
        </defs>

        <g clipPath="url(#fleetbase-logo-swoosh-clip)" className="fleetbase-logo-loader__swoosh">
          <image href={LOGO_SRC} width="512" height="320" preserveAspectRatio="xMidYMid meet" />
        </g>

        <g clipPath="url(#fleetbase-logo-streaks-clip)" className="fleetbase-logo-loader__streaks">
          <image href={LOGO_SRC} width="512" height="320" preserveAspectRatio="xMidYMid meet" />
        </g>

        <g clipPath="url(#fleetbase-logo-mark-clip)" className="fleetbase-logo-loader__mark">
          <image href={LOGO_SRC} width="512" height="320" preserveAspectRatio="xMidYMid meet" />
        </g>
      </svg>
    </span>
  );
}

export default memo(LogoLoader);

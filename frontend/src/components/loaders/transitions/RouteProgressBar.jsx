import { memo } from "react";

function RouteProgressBar({ active }) {
  return (
    <div
      className="fleetbase-route-progress"
      data-active={active ? "true" : "false"}
      data-testid="route-progress-loader"
      aria-hidden="true"
    >
      <div className="fleetbase-route-progress__bar" />
    </div>
  );
}

export default memo(RouteProgressBar);

import { memo } from "react";
import ArcSpinner from "@/components/loaders/Spinner/ArcSpinner";
import { BRAND_LOADER_VIEWPORT_SIZE } from "@/components/loaders/Spinner/LogoLoader";

/** Centered logo with optional status line beneath (boot splash layout). */
function BrandLoaderContent({ message, spinnerTestId, messageTestId }) {
  return (
    <>
      <ArcSpinner size={BRAND_LOADER_VIEWPORT_SIZE} testId={spinnerTestId} />
      {message ? (
        <p className="fleetbase-loader-brand-message" data-testid={messageTestId}>
          {message}
        </p>
      ) : null}
    </>
  );
}

export default memo(BrandLoaderContent);

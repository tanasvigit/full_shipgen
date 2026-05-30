import { forwardRef } from "react";
import { Button } from "@/components/ui/button";
import ArcSpinner from "@/components/loaders/Spinner/ArcSpinner";
import { cn } from "@/lib/utils";

const LoadingButton = forwardRef(function LoadingButton(
  { loading, loadingText, children, disabled, className, ...props },
  ref,
) {
  return (
    <Button
      ref={ref}
      disabled={disabled || loading}
      aria-busy={loading}
      className={cn(className)}
      data-loading={loading ? "true" : undefined}
      {...props}
    >
      {loading && <ArcSpinner size="sm" className="!size-4" testId="button-loader-spinner" />}
      {loading && loadingText ? loadingText : children}
    </Button>
  );
});

export default LoadingButton;

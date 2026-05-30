import { useEffect, useCallback } from "react";
import * as SheetPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { isDetailEditGuarded } from "@/hooks/fleetops/useFleetopsDetailDirty";

/**
 * Enterprise right-side detail drawer.
 * When `suspended`, overlay is hidden and sheet is non-modal so edit dialog owns focus.
 */
export default function EntityDetailDrawer({
  open,
  onOpenChange,
  suspended = false,
  width = 720,
  large = false,
  testId = "entity-detail-drawer",
  accessibilityTitle = "FleetOps detail",
  header,
  footer,
  children,
  dirty = false,
  onCloseAttempt,
}) {
  const widthStyle =
    typeof width === "string" ? width : `${width}px`;

  const handleOpenChange = useCallback(
    (next) => {
      if (!next && (suspended || isDetailEditGuarded())) return;
      if (!next && dirty && onCloseAttempt) {
        const allow = onCloseAttempt();
        if (allow === false) return;
      }
      onOpenChange(next);
    },
    [suspended, dirty, onCloseAttempt, onOpenChange],
  );

  useEffect(() => {
    if (!open || suspended) return undefined;
    const onKey = (e) => {
      if (e.key === "Escape") handleOpenChange(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, suspended, handleOpenChange]);

  return (
    <SheetPrimitive.Root open={open} onOpenChange={handleOpenChange} modal={false}>
      <SheetPrimitive.Portal>
        {!suspended && (
          <SheetPrimitive.Overlay
            className={cn(
              "fixed inset-0 z-50",
              "md:bg-[rgba(15,23,42,0.08)]",
              "max-md:bg-[#0A0E1A]/50",
              "data-[state=open]:animate-in data-[state=closed]:animate-out",
              "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
            )}
            data-testid={`${testId}-overlay`}
          />
        )}
        <SheetPrimitive.Content
          className={cn(
            "fixed inset-y-0 right-0 z-50 flex flex-col bg-[#FAFBFC]",
            "border-l border-black/[0.08]",
            "shadow-[-12px_0_40px_-12px_rgba(15,23,42,0.14)] md:shadow-[-16px_0_48px_-16px_rgba(15,23,42,0.18)]",
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right",
            "duration-300 max-md:inset-0 max-md:w-full max-md:max-w-none max-md:rounded-none",
            large && "max-md:h-[92vh] max-md:top-auto max-md:bottom-0 max-md:rounded-t-xl",
            suspended && "pointer-events-none",
          )}
          style={{
            width: widthStyle,
            maxWidth: large ? "90vw" : "100vw",
          }}
          data-testid={testId}
          data-suspended={suspended ? "true" : "false"}
          aria-modal={!suspended}
          role="dialog"
          onInteractOutside={(e) => {
            if (suspended) e.preventDefault();
          }}
          onEscapeKeyDown={(e) => {
            if (suspended) e.preventDefault();
          }}
          onPointerDownOutside={(e) => {
            if (suspended) e.preventDefault();
          }}
        >
          <SheetPrimitive.Title className="sr-only">{accessibilityTitle}</SheetPrimitive.Title>
          <SheetPrimitive.Description className="sr-only">
            Operational detail panel for {accessibilityTitle.toLowerCase()}.
          </SheetPrimitive.Description>

          <SheetPrimitive.Close
            className={cn(
              "absolute right-3 top-3 z-20 rounded-md p-2 opacity-70 hover:opacity-100 hover:bg-black/[0.05] focus:outline-none focus:ring-2 focus:ring-[#0066FF]/40",
              suspended && "hidden",
            )}
            data-testid={`${testId}-close`}
            tabIndex={suspended ? -1 : 0}
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </SheetPrimitive.Close>

          {header && (
            <div
              className="sticky top-0 z-10 shrink-0 border-b border-black/[0.08] bg-[#FAFBFC]"
              data-testid={`${testId}-header`}
            >
              {header}
            </div>
          )}

          <div
            className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden focus:outline-none"
            data-testid={`${testId}-body`}
          >
            {children}
          </div>

          {footer && (
            <div
              className="sticky bottom-0 z-10 shrink-0 border-t border-black/[0.08] bg-[#FAFBFC] px-4 py-3"
              data-testid={`${testId}-footer`}
            >
              {footer}
            </div>
          )}
        </SheetPrimitive.Content>
      </SheetPrimitive.Portal>
    </SheetPrimitive.Root>
  );
}

import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import ArcSpinner from "@/components/loaders/Spinner/ArcSpinner";
import { ensureFleetopsEditPortal } from "@/components/fleetops/detail/fleetopsEditPortal";
import { cn } from "@/lib/utils";

export const FLEETOPS_MODAL_OVERLAY_Z = "z-[99]";
export const FLEETOPS_MODAL_CONTENT_Z = "z-[100]";

export const FLEETOPS_FORM_DIALOG_SIZES = {
  sm: "max-w-lg",
  lg: "max-w-3xl",
  xl: "max-w-4xl",
  "5xl": "max-w-5xl",
};

const BODY_MAX_H =
  "max-h-[calc(90vh-11rem)] max-md:max-h-[calc(100dvh-11rem)]";

function getPortalContainer() {
  if (typeof document === "undefined") return undefined;
  return ensureFleetopsEditPortal() || document.body;
}

function DialogPanel({
  title,
  description,
  children,
  onSubmit,
  submitLabel,
  busyLabel,
  busy,
  submitDisabled,
  error,
  testId,
  maxW,
  onOpenChange,
}) {
  return (
    <>
      <DialogPrimitive.Overlay
        className={cn(
          FLEETOPS_MODAL_OVERLAY_Z,
          "fixed inset-0 bg-[#F5F6F8]/80",
          "data-[state=open]:animate-in data-[state=closed]:animate-out",
          "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
        )}
      />
      <DialogPrimitive.Content
        className={cn(
          FLEETOPS_MODAL_CONTENT_Z,
          maxW,
          "fixed left-[50%] top-[50%] w-[calc(100%-2rem)] translate-x-[-50%] translate-y-[-50%]",
          "max-h-[90vh] min-h-0 gap-0 overflow-hidden border bg-background p-0 shadow-lg",
          "duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out",
          "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
          "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
          "sm:rounded-lg",
          "!flex !flex-col",
          "max-md:inset-0 max-md:left-0 max-md:top-0 max-md:h-[100dvh] max-md:max-h-none",
          "max-md:w-full max-md:translate-x-0 max-md:translate-y-0 max-md:rounded-none",
        )}
        data-testid={testId}
      >
        <div className="shrink-0 border-b border-black/[0.08] bg-white px-6 pt-6 pb-4 pr-12 text-left">
          <DialogPrimitive.Title className="text-lg font-semibold leading-none tracking-tight">
            {title || "Form"}
          </DialogPrimitive.Title>
          {description ? (
            <DialogPrimitive.Description className="mt-1.5 text-sm text-muted-foreground">
              {description}
            </DialogPrimitive.Description>
          ) : (
            <DialogPrimitive.Description className="sr-only">
              FleetOps form dialog
            </DialogPrimitive.Description>
          )}
        </div>

        <form
          className="flex min-h-0 flex-col outline-none"
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit?.(e);
          }}
        >
          <div
            className={cn(
              "min-h-[12rem] shrink-0 overflow-y-auto overscroll-contain",
              BODY_MAX_H,
            )}
          >
            <div className="space-y-4 px-6 py-4 pb-8">{children}</div>
          </div>

          {error && (
            <div
              className="shrink-0 mx-6 mt-2 text-sm text-[#B91C1C] bg-red-500/5 border border-red-500/20 rounded-md px-3 py-2"
              data-testid={`${testId}-error`}
              role="alert"
            >
              {error}
            </div>
          )}

          <div className="shrink-0 flex flex-row justify-end gap-2 border-t border-black/[0.08] bg-white px-6 py-4 shadow-[0_-4px_16px_-4px_rgba(15,23,42,0.08)]">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={busy || submitDisabled}
              className="bg-[#0066FF] hover:bg-[#0040CC]"
              data-testid={`${testId}-submit`}
            >
              {busy && <ArcSpinner size="sm" className="!size-4 mr-2" testId="form-submit-spinner" />}
              {busy ? busyLabel : submitLabel}
            </Button>
          </div>
        </form>

        <DialogPrimitive.Close
          className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          disabled={busy}
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </>
  );
}

export default function FleetOpsFormDialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  onSubmit,
  submitLabel = "Save",
  busyLabel = "Saving…",
  busy = false,
  submitDisabled = false,
  error,
  testId = "fleetops-form-dialog",
  size = "lg",
  dirty = false,
  /** When true, parent DetailEditModalPortal already mounted outside drawer — skip inner Portal. */
  detached = false,
}) {
  const maxW = FLEETOPS_FORM_DIALOG_SIZES[size] || FLEETOPS_FORM_DIALOG_SIZES.lg;

  const handleOpenChange = (next) => {
    if (!next && dirty) {
      const ok = window.confirm("Discard unsaved changes?");
      if (!ok) return;
    }
    onOpenChange(next);
  };

  if (!open) return null;

  const panel = (
    <DialogPanel
      title={title}
      description={description}
      onSubmit={onSubmit}
      submitLabel={submitLabel}
      busyLabel={busyLabel}
      busy={busy}
      submitDisabled={submitDisabled}
      error={error}
      testId={testId}
      maxW={maxW}
      onOpenChange={onOpenChange}
    >
      {children}
    </DialogPanel>
  );

  return (
    <DialogPrimitive.Root open={open} onOpenChange={handleOpenChange} modal>
      {detached ? (
        panel
      ) : (
        <DialogPrimitive.Portal container={getPortalContainer()}>{panel}</DialogPrimitive.Portal>
      )}
    </DialogPrimitive.Root>
  );
}

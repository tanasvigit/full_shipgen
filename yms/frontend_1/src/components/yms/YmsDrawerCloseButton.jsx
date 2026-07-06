import { X } from "lucide-react";
import { SheetClose } from "../ui/sheet";
import { cn } from "@/lib/utils";

/**
 * Visible close control for YMS detail drawers.
 * Use `onDark` inside slate-900 headers; default variant for light headers.
 */
export default function YmsDrawerCloseButton({ onDark = false, className, testId = "drawer-close" }) {
  return (
    <SheetClose
      data-testid={testId}
      aria-label="Close"
      className={cn(
        "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md border transition-colors",
        "focus:outline-none focus:ring-2 focus:ring-offset-2",
        onDark
          ? "border-white/20 bg-white/10 text-white hover:bg-white/20 focus:ring-white/40 focus:ring-offset-slate-900"
          : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900 focus:ring-slate-300 focus:ring-offset-white",
        className,
      )}
    >
      <X className="h-4 w-4" />
      <span className="sr-only">Close</span>
    </SheetClose>
  );
}

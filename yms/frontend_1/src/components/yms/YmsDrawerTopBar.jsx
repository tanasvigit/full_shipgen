import { cn } from "@/lib/utils";
import YmsDrawerCloseButton from "./YmsDrawerCloseButton";

/** Light-header drawer top bar with a consistent close control. */
export default function YmsDrawerTopBar({ children, className }) {
  return (
    <div className={cn("flex items-start justify-between gap-3 border-b border-slate-200 px-5 py-4", className)}>
      <div className="flex-1 min-w-0">{children}</div>
      <YmsDrawerCloseButton className="shrink-0" />
    </div>
  );
}

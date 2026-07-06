import { cn } from "@/lib/utils";

/** Horizontal padding for drawer scroll content (matches header `px-5`). */
export const YMS_DRAWER_BODY_CLASS = "px-5 pb-6 pt-4 space-y-4";

export const YMS_DRAWER_LOADING_CLASS = "px-5 py-12 text-center text-sm text-slate-500";

export default function YmsDrawerBody({ children, className, spaceY = 4 }) {
  return (
    <div
      className={cn(
        "px-5 pb-6 pt-4",
        spaceY === 5 ? "space-y-5" : spaceY === 6 ? "space-y-6" : "space-y-4",
        className,
      )}
    >
      {children}
    </div>
  );
}

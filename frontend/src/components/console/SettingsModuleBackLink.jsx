import { Link } from "react-router-dom";
import { ArrowLeft, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { SETTINGS_MODULES_BACK_TO } from "@/lib/settingsNavigation";

/**
 * Prominent return control for platform modules opened from Settings (IAM, Developers, Registry).
 */
export default function SettingsModuleBackLink({ className, compact = false, fullWidth = false }) {
  return (
    <Link
      to={SETTINGS_MODULES_BACK_TO}
      data-testid="settings-module-back"
      className={cn(
        "inline-flex items-center gap-2 rounded-lg font-semibold transition-all",
        "bg-[#0066FF] text-white border border-[#0052CC]",
        "shadow-[0_4px_14px_-6px_rgba(0,102,255,0.65)]",
        "hover:bg-[#0040CC] hover:border-[#0039B3] hover:shadow-[0_6px_18px_-6px_rgba(0,102,255,0.75)]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0066FF]/40 focus-visible:ring-offset-2",
        compact ? "px-3 py-2 text-xs" : "px-3 py-2.5 text-[12px]",
        fullWidth && "w-full justify-center",
        className,
      )}
    >
      <ArrowLeft className={compact ? "h-3.5 w-3.5 shrink-0" : "h-4 w-4 shrink-0"} strokeWidth={2.25} />
      <span className="tracking-tight">Back to Settings</span>
      <Settings className={cn("shrink-0 opacity-90", compact ? "h-3 w-3 ml-0.5" : "h-3.5 w-3.5 ml-auto")} strokeWidth={2} />
    </Link>
  );
}

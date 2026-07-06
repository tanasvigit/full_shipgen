import { useTenant } from "@/contexts/TenantContext";
import { getCurrencySymbol } from "@/lib/tenant/locale";
import { cn } from "@/lib/utils";

/** Sidebar/header icon slot showing the tenant currency symbol. */
export default function CurrencyNavIcon({ className, currency, ...props }) {
  const { preferences } = useTenant();
  const symbol = getCurrencySymbol(currency ?? preferences?.currency);

  return (
    <span
      className={cn(
        "inline-flex h-4 w-4 shrink-0 items-center justify-center font-mono text-[11px] font-semibold leading-none",
        className,
      )}
      aria-hidden
      {...props}
    >
      {symbol}
    </span>
  );
}

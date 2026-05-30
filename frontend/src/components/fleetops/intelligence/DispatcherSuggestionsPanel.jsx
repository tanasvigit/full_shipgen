import { Lightbulb, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function DispatcherSuggestionsPanel({
  suggestions = [],
  onOpenOrder,
  onOpenDriver,
  collapsed = false,
  onToggleCollapse,
  testId = "dispatcher-suggestions",
}) {
  if (!suggestions.length && collapsed) return null;

  return (
    <div className="bg-white border border-black/[0.08] rounded-xl overflow-hidden" data-testid={testId}>
      <button
        type="button"
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-[#F5F6F8]/80 text-left"
        onClick={onToggleCollapse}
      >
        <span className="flex items-center gap-2 text-sm font-semibold text-[#0A0E1A]">
          <Lightbulb className="h-4 w-4 text-[#0066FF]" />
          Dispatcher suggestions
          <span className="text-[10px] font-mono font-normal text-[#6B7280]">({suggestions.length})</span>
        </span>
        <ChevronRight className={`h-4 w-4 transition-transform ${collapsed ? "" : "rotate-90"}`} />
      </button>
      {!collapsed && (
        <ul className="divide-y divide-black/[0.06] border-t border-black/[0.06]">
          {suggestions.length === 0 ? (
            <li className="px-4 py-6 text-sm text-[#4B5563] text-center">No suggestions — operations look healthy.</li>
          ) : (
            suggestions.map((s) => (
              <li key={s.id} className="px-4 py-3 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-sm font-medium text-[#0A0E1A]">{s.title}</div>
                  <p className="text-xs text-[#4B5563] mt-0.5">{s.detail}</p>
                </div>
                <div className="flex gap-1 shrink-0">
                  {s.orderId && (
                    <Button type="button" size="sm" variant="outline" className="h-7 text-xs" onClick={() => onOpenOrder?.(s.orderId)}>
                      Order
                    </Button>
                  )}
                  {s.orderIds?.[0] && !s.orderId && (
                    <Button type="button" size="sm" variant="outline" className="h-7 text-xs" onClick={() => onOpenOrder?.(s.orderIds[0])}>
                      View
                    </Button>
                  )}
                  {s.driverId && (
                    <Button type="button" size="sm" variant="ghost" className="h-7 text-xs" onClick={() => onOpenDriver?.(s.driverId)}>
                      Driver
                    </Button>
                  )}
                </div>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}

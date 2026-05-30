import { Button } from "@/components/ui/button";
import StatusBadge from "@/components/common/StatusBadge";
import { statusLabel } from "@/lib/mappers";
import { Route, Calendar, UserPlus, X } from "lucide-react";

export default function OrderListMapOverlay({
  orders = [],
  selectedKeys,
  onSelectedKeysChange,
  onFocusOrder,
  focusId,
  onPlanRoute,
  onSchedule,
  onAssignDriver,
  canPlanRoutes = false,
  canSchedule = false,
  canAssign = false,
}) {
  const selectedSet = selectedKeys instanceof Set ? selectedKeys : new Set(selectedKeys || []);
  const selectedCount = selectedSet.size;

  const toggle = (id, checked) => {
    if (!onSelectedKeysChange) return;
    const next = new Set(selectedSet);
    if (checked) next.add(id);
    else next.delete(id);
    onSelectedKeysChange(next);
  };

  return (
    <div
      className="absolute top-3 left-3 z-[500] w-[min(320px,90vw)] max-h-[70%] overflow-hidden flex flex-col bg-white/95 backdrop-blur border border-black/[0.1] rounded-lg shadow-lg"
      data-testid="orders-map-overlay"
    >
      <div className="px-3 py-2 border-b border-black/[0.08] flex items-center justify-between">
        <span className="text-xs font-mono uppercase tracking-wider text-[#4B5563]">
          Orders on map ({orders.length})
        </span>
        {selectedCount > 0 && (
          <button type="button" className="text-[#6B7280] hover:text-[#0A0E1A]" onClick={() => onSelectedKeysChange?.(new Set())}>
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {selectedCount > 0 && (
        <div className="px-3 py-2 border-b border-black/[0.08] flex flex-wrap gap-1 bg-[#F5F6F8]">
          {canPlanRoutes && onPlanRoute && (
            <Button type="button" size="sm" variant="outline" className="h-7 text-xs" onClick={onPlanRoute} data-testid="overlay-plan-route">
              <Route className="h-3 w-3 mr-1" /> Plan route
            </Button>
          )}
          {canSchedule && onSchedule && (
            <Button type="button" size="sm" variant="outline" className="h-7 text-xs" onClick={onSchedule}>
              <Calendar className="h-3 w-3 mr-1" /> Schedule
            </Button>
          )}
          {canAssign && onAssignDriver && (
            <Button type="button" size="sm" variant="outline" className="h-7 text-xs" onClick={onAssignDriver}>
              <UserPlus className="h-3 w-3 mr-1" /> Assign
            </Button>
          )}
        </div>
      )}

      <ul className="overflow-y-auto flex-1 divide-y divide-black/[0.05]">
        {orders.map((order) => {
          const checked = selectedSet.has(order.id);
          const focused = focusId && String(focusId) === String(order.id);
          return (
            <li
              key={order.id}
              className={`px-3 py-2 text-sm cursor-pointer hover:bg-[#F5F6F8] ${focused ? "bg-blue-50" : ""}`}
              onClick={() => onFocusOrder?.(order.id)}
            >
              <div className="flex items-start gap-2">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={(e) => {
                    e.stopPropagation();
                    toggle(order.id, e.target.checked);
                  }}
                  onClick={(e) => e.stopPropagation()}
                  className="mt-1 rounded"
                  data-testid={`overlay-select-${order.id}`}
                />
                <div className="flex-1 min-w-0">
                  <div className="font-mono text-xs text-[#0066FF]">{order.publicId}</div>
                  <div className="text-xs text-[#374151] truncate">{order.customer?.name}</div>
                  <StatusBadge status={order.status} label={statusLabel(order.status)} />
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

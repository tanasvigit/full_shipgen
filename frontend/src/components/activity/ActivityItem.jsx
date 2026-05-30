import StatusBadge from "@/components/common/StatusBadge";
import { User, Truck, Upload, Route, Package, XCircle, Clock } from "lucide-react";

const ICONS = {
  created: Package,
  dispatch: Truck,
  route: Route,
  arrived: Clock,
  completed: Package,
  canceled: XCircle,
  failed: XCircle,
  delayed: Clock,
  upload: Upload,
  edit: Package,
  assign: User,
  schedule: Clock,
  event: Clock,
};

export default function ActivityItem({ event, testId }) {
  const Icon = ICONS[event.icon] || ICONS.event;

  return (
    <div className="flex gap-3 relative" data-testid={testId || `activity-item-${event.id}`}>
      <div className="relative z-10 h-8 w-8 rounded-full bg-[#F5F6F8] border border-black/[0.08] grid place-items-center shrink-0">
        <Icon className="h-3.5 w-3.5 text-[#0066FF]" strokeWidth={1.75} />
      </div>
      <div className="flex-1 min-w-0 pb-6">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium text-sm text-[#0A0E1A]">{event.title}</span>
          {event.status && <StatusBadge status={event.status} label={event.status} />}
        </div>
        {event.detail && <p className="text-sm text-[#4B5563] mt-1">{event.detail}</p>}
        <div className="text-[11px] font-mono text-[#6B7280] mt-1.5 flex gap-2 flex-wrap">
          <span>{event.actor}</span>
          {event.relative && <span>· {event.relative}</span>}
        </div>
      </div>
    </div>
  );
}

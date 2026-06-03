import { Bell, Package, AlertTriangle, CheckCircle2, XCircle } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
} from "@/components/ui/dropdown-menu";
import { useCallback, useEffect, useState } from "react";
import { consoleService } from "@/services/console";
import { mapNotification } from "@/lib/mappers";
import { toast } from "sonner";

function iconFor(level) {
  if (level === "warning") return AlertTriangle;
  if (level === "danger") return XCircle;
  if (level === "success") return CheckCircle2;
  return Package;
}
function colorFor(level) {
  if (level === "warning") return "text-[#A16207] bg-amber-500/10 border-amber-500/20";
  if (level === "danger") return "text-[#B91C1C] bg-red-500/10 border-red-500/20";
  if (level === "success") return "text-[#15803D] bg-emerald-500/10 border-emerald-500/20";
  return "text-[#0066FF] bg-blue-500/10 border-blue-500/20";
}

export default function NotificationsTray() {
  const [items, setItems] = useState([]);
  const navigate = useNavigate();
  const unread = items.filter((n) => !n.read).length;

  const load = useCallback(async () => {
    try {
      const notifications = await consoleService.listNotifications();
      setItems(notifications.map(mapNotification));
    } catch (err) {
      toast.error(err?.friendlyMessage || "Could not load notifications.");
      setItems([]);
    }
  }, []);

  useEffect(() => {
    load();
    const id = setInterval(load, 60000);
    return () => clearInterval(id);
  }, [load]);

  async function markAllRead() {
    try {
      await consoleService.markAllNotificationsRead();
      await load();
    } catch (err) {
      toast.error(err?.friendlyMessage || "Could not mark all read.");
    }
  }

  async function open(n) {
    try {
      if (!n.read) {
        await consoleService.markNotificationRead([n.id]);
        await load();
      }
    } catch {
      /* still navigate */
    }
    navigate(n.link || "/notifications");
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          data-testid="notifications-trigger"
          className="relative grid h-8 w-8 shrink-0 place-items-center rounded-md border border-transparent hover:border-black/[0.08] hover:bg-[#F1F2F5] transition-colors"
          aria-label="Notifications"
        >
          <Bell className="h-4 w-4 text-[#374151]" strokeWidth={1.75} />
          {unread > 0 && (
            <span className="absolute top-1 right-1 h-4 min-w-4 px-1 grid place-items-center bg-blue-600 text-[#0A0E1A] text-[9px] font-mono font-bold rounded-sm">
              {unread}
            </span>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="bg-white border-black/[0.08] w-[380px] p-0">
        <div className="flex items-center justify-between px-4 py-3 border-b border-black/[0.08]">
          <div>
            <div className="font-display font-semibold text-sm">Notifications</div>
            <div className="text-[11px] text-[#4B5563] font-mono">
              {unread} unread of {items.length}
            </div>
          </div>
          <button type="button" onClick={markAllRead} className="text-[11px] font-medium text-[#0066FF] hover:text-[#0066FF]" data-testid="notifications-mark-all-read">
            Mark all read
          </button>
        </div>
        <div className="max-h-[420px] overflow-y-auto">
          {items.length === 0 && <div className="px-4 py-6 text-sm text-[#4B5563] text-center">No notifications</div>}
          {items.slice(0, 6).map((n) => {
            const Icon = iconFor(n.level);
            return (
              <button
                key={n.id}
                type="button"
                onClick={() => open(n)}
                data-testid={`notification-item-${n.id}`}
                className={`w-full text-left px-4 py-3 border-b border-black/[0.08]/60 hover:bg-[#F1F2F5] transition-colors flex gap-3 ${n.read ? "opacity-60" : ""}`}
              >
                <div className={`h-8 w-8 grid place-items-center rounded-sm border shrink-0 ${colorFor(n.level)}`}>
                  <Icon className="h-3.5 w-3.5" strokeWidth={1.75} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-[#0A0E1A] truncate">{n.title}</div>
                  <div className="text-xs text-[#374151] truncate">{n.body}</div>
                  <div className="text-[10px] font-mono text-[#4B5563] mt-1 uppercase tracking-wider">{String(n.time)}</div>
                </div>
                {!n.read && <span className="h-2 w-2 rounded-full bg-blue-500 self-center" />}
              </button>
            );
          })}
        </div>
        <Link to="/notifications" className="block px-4 py-3 text-center text-xs font-medium text-[#0066FF] hover:text-[#0066FF] border-t border-black/[0.08]" data-testid="notifications-view-all">
          View all notifications
        </Link>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

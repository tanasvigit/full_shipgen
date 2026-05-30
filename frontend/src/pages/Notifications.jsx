import { useCallback, useEffect, useState } from "react";
import PageHeader from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Inbox, CheckCheck, AlertTriangle, CheckCircle2, XCircle, Package } from "lucide-react";
import { Link } from "react-router-dom";
import EmptyState from "@/components/common/EmptyState";
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

export default function Notifications() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState([]);
  const [filter, setFilter] = useState("all");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const notifications = await consoleService.listNotifications();
      setItems(notifications.map(mapNotification));
    } catch (err) {
      toast.error(err?.friendlyMessage || "Could not load notifications.");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = items.filter((n) => {
    if (filter === "unread") return !n.read;
    if (filter === "read") return n.read;
    return true;
  });

  function toggle(id) {
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  }
  function selectAll() {
    setSelected(filtered.map((n) => n.id));
  }
  async function bulkMark() {
    if (!selected.length) return;
    try {
      await consoleService.markNotificationRead(selected);
      await load();
      setSelected([]);
      toast.success("Marked as read");
    } catch (err) {
      toast.error(err?.friendlyMessage || "Could not mark notifications.");
    }
  }
  async function markAllRead() {
    try {
      await consoleService.markAllNotificationsRead();
      await load();
    } catch (err) {
      toast.error(err?.friendlyMessage || "Could not mark all as read.");
    }
  }

  return (
    <div data-testid="notifications-page">
      <PageHeader
        overline="Inbox"
        title="Notifications"
        description="System alerts and activity for your organization."
        actions={
          <Button
            onClick={markAllRead}
            variant="outline"
            className="bg-transparent border-black/[0.08] hover:bg-[#F1F2F5] text-[#1F2937]"
            data-testid="notifications-mark-all"
          >
            <CheckCheck className="h-4 w-4 mr-1.5" /> Mark all read
          </Button>
        }
      />
      <div className="p-6 space-y-4">
        {loading && <div className="text-sm text-[#4B5563]">Loading notifications…</div>}
        <div className="flex items-center gap-2">
          {["all", "unread", "read"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              data-testid={`notifications-filter-${f}`}
              className={`px-3 h-8 text-xs font-mono uppercase tracking-wider rounded-sm border ${
                filter === f ? "bg-blue-600/10 border-blue-500/40 text-[#0066FF]" : "bg-white border-black/[0.08] text-[#374151] hover:bg-[#F1F2F5]"
              }`}
            >
              {f}
              <span className="ml-1 text-[#4B5563]">
                (
                {f === "all"
                  ? items.length
                  : f === "unread"
                    ? items.filter((n) => !n.read).length
                    : items.filter((n) => n.read).length}
                )
              </span>
            </button>
          ))}
          {selected.length > 0 && (
            <div className="ml-auto flex items-center gap-2">
              <span className="text-xs text-[#374151]">{selected.length} selected</span>
              <Button onClick={bulkMark} size="sm" variant="outline" className="bg-transparent border-black/[0.08] hover:bg-[#F1F2F5] h-8" data-testid="notifications-bulk-mark">
                <CheckCheck className="h-3.5 w-3.5 mr-1" /> Mark read
              </Button>
            </div>
          )}
        </div>

        {filtered.length === 0 && !loading ? (
          <EmptyState title="No notifications" description="You're all caught up." icon={Inbox} />
        ) : (
          <div className="border border-black/[0.08] rounded-md bg-white divide-y divide-black/[0.08]">
            <div className="flex items-center gap-3 px-4 py-2 text-[10px] uppercase tracking-wider text-[#4B5563] font-semibold bg-white/60">
              <Checkbox
                checked={selected.length > 0 && selected.length === filtered.length}
                onCheckedChange={(v) => (v ? selectAll() : setSelected([]))}
                className="border-black/[0.14]"
                data-testid="notifications-select-all"
              />
              <span>{filtered.length} items</span>
            </div>
            {filtered.map((n) => {
              const Icon = iconFor(n.level);
              return (
                <div key={n.id} className={`flex items-start gap-3 px-4 py-3 hover:bg-[#F1F2F5]/50 transition-colors ${n.read ? "opacity-70" : ""}`}>
                  <Checkbox
                    checked={selected.includes(n.id)}
                    onCheckedChange={() => toggle(n.id)}
                    className="border-black/[0.14] mt-1"
                    data-testid={`notifications-checkbox-${n.id}`}
                  />
                  <div className={`h-9 w-9 grid place-items-center rounded-sm border shrink-0 ${colorFor(n.level)}`}>
                    <Icon className="h-4 w-4" strokeWidth={1.75} />
                  </div>
                  <Link to={n.link} className="flex-1 min-w-0" data-testid={`notifications-item-${n.id}`}>
                    <div className="flex items-center gap-2">
                      <div className="font-medium text-sm text-[#0A0E1A]">{n.title}</div>
                      {!n.read && <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />}
                    </div>
                    <div className="text-xs text-[#374151]">{n.body}</div>
                  </Link>
                  <div className="text-[10px] font-mono uppercase tracking-wider text-[#4B5563] whitespace-nowrap pt-1">{String(n.time)}</div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

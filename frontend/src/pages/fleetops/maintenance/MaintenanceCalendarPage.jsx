import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { addMonths, endOfMonth, format, startOfMonth, subMonths } from "date-fns";
import PageHeader from "@/components/common/PageHeader";
import StatusBadge from "@/components/common/StatusBadge";
import { Button } from "@/components/ui/button";
import { fleetopsService } from "@/services/fleetops";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { parseApiError } from "@/lib/errors";
import { toast } from "sonner";

function normalizeEvents(payload) {
  const raw = payload?.events || payload?.data || payload;
  return Array.isArray(raw) ? raw : [];
}

export default function MaintenanceCalendarPage() {
  const [cursor, setCursor] = useState(() => startOfMonth(new Date()));
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  const range = useMemo(() => {
    const start = startOfMonth(cursor);
    const end = endOfMonth(cursor);
    return { start, end };
  }, [cursor]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const payload = await fleetopsService.getMaintenanceCalendarFeed({
        start: range.start.toISOString(),
        end: range.end.toISOString(),
      });
      setEvents(normalizeEvents(payload));
    } catch (err) {
      toast.error(parseApiError(err, "Could not load maintenance calendar."));
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, [range.end, range.start]);

  useEffect(() => {
    load();
  }, [load]);

  const byDay = useMemo(() => {
    const map = new Map();
    for (const ev of events) {
      const dayKey = String(ev.start || ev.date || ev.next_due_date || "").slice(0, 10);
      if (!dayKey) continue;
      if (!map.has(dayKey)) map.set(dayKey, []);
      map.get(dayKey).push(ev);
    }
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [events]);

  return (
    <div data-testid="maintenance-calendar-page">
      <PageHeader
        breadcrumbs={[
          { label: "FleetOps", to: "/fleet-ops" },
          { label: "Maintenance" },
          { label: "Calendar" },
        ]}
        overline="Maintenance"
        title="Maintenance calendar"
        description={loading ? "Loading…" : `${events.length} upcoming events`}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setCursor((c) => subMonths(c, 1))} data-testid="calendar-prev">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => setCursor(startOfMonth(new Date()))} data-testid="calendar-today">
              Today
            </Button>
            <Button variant="outline" size="sm" onClick={() => setCursor((c) => addMonths(c, 1))} data-testid="calendar-next">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        }
      />
      <div className="p-6 space-y-4">
        <div className="text-lg font-medium">{format(cursor, "MMMM yyyy")}</div>
        {loading ? (
          <div className="text-sm text-[#4B5563]">Loading calendar feed…</div>
        ) : byDay.length === 0 ? (
          <div className="text-sm text-[#4B5563]" data-testid="calendar-empty">
            No scheduled maintenance in this month.
          </div>
        ) : (
          <div className="space-y-4">
            {byDay.map(([day, dayEvents]) => (
              <div key={day} className="bg-white border border-black/[0.08] rounded-md p-4" data-testid={`calendar-day-${day}`}>
                <div className="font-mono text-xs text-[#4B5563] mb-3">{format(new Date(day), "EEE, d MMM yyyy")}</div>
                <ul className="space-y-2">
                  {dayEvents.map((ev) => (
                    <li key={`${ev.uuid || ev.id}-${ev.title}`} className="flex items-start justify-between gap-3 text-sm">
                      <div>
                        <div className="font-medium">{ev.title || ev.name || "Maintenance"}</div>
                        {ev.asset_name && <div className="text-xs text-[#4B5563]">{ev.asset_name}</div>}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {ev.priority && <StatusBadge status={ev.priority} label={ev.priority} />}
                        {ev.uuid && (
                          <Link className="text-[#0066FF] text-xs" to={`/fleet-ops/maintenance/schedules/${ev.uuid}`}>
                            View
                          </Link>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

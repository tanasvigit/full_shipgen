import { useCallback, useEffect, useMemo, useState } from "react";
import PageHeader from "@/components/common/PageHeader";
import FleetOpsFormDialog from "@/components/fleetops/FleetOpsFormDialog";
import ShiftForm from "@/components/fleetops/forms/ShiftForm";
import { useFleetopsFormDialog, useFormRef } from "@/components/fleetops/useFleetopsFormDialog";
import { Button } from "@/components/ui/button";
import { Plus, Sun, Moon, ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import { addWeeks, startOfWeek, format, addDays } from "date-fns";
import { toast } from "sonner";
import { fleetopsService } from "@/services/fleetops";
import { schedulesService } from "@/services/schedules";
import { mapDriverRow } from "@/lib/mappers";
import { detectScheduleConflicts } from "@/lib/fleetops/scheduleConflicts";
import FleetScheduleView from "@/components/fleetops/schedule/FleetScheduleView";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function weekdayFromItem(item) {
  const raw = item?.weekday ?? item?.day ?? item?.day_of_week ?? item?.dayOfWeek;
  if (raw == null) return null;
  if (typeof raw === "number" && DAYS[raw] != null) return DAYS[raw];
  const s = String(raw).trim();
  if (DAYS.includes(s)) return s;
  const short = s.slice(0, 3);
  const ix = DAYS.findIndex((d) => d.toLowerCase().startsWith(short.toLowerCase()));
  return ix >= 0 ? DAYS[ix] : null;
}

function driverIdFromItem(item) {
  return item?.driver_uuid || item?.driver_id || item?.driver?.id || item?.driver?.uuid || null;
}

function hourWindowFromItem(item) {
  const a = item?.start_hour ?? item?.startHour;
  const b = item?.end_hour ?? item?.endHour;
  if (a != null && b != null) return `${Number(a)}-${Number(b)}`;
  const start = item?.starts_at || item?.start_time || item?.start;
  const end = item?.ends_at || item?.end_time || item?.end;
  if (!start || !end) return null;
  try {
    const da = new Date(start);
    const db = new Date(end);
    if (Number.isNaN(da.getTime()) || Number.isNaN(db.getTime())) return null;
    return `${da.getHours()}-${db.getHours()}`;
  } catch {
    return null;
  }
}

function buildRows(drivers, items) {
  return drivers.map((d) => ({
    id: d.id,
    name: d.name,
    shifts: DAYS.map((day) => {
      const match = items.find((it) => driverIdFromItem(it) && String(driverIdFromItem(it)) === String(d.id) && weekdayFromItem(it) === day);
      return match ? hourWindowFromItem(match) : null;
    }),
  }));
}

export default function SchedulePlanner() {
  const [tab, setTab] = useState("shifts");
  const [weekOffset, setWeekOffset] = useState(0);
  const [loading, setLoading] = useState(true);
  const [driverRows, setDriverRows] = useState([]);
  const [items, setItems] = useState([]);
  const formRef = useFormRef();
  const driverOptions = useMemo(
    () => driverRows.map((d) => ({ id: String(d.id), label: d.name })),
    [driverRows],
  );
  const dialog = useFleetopsFormDialog({
    formRef,
    successMessage: "Shift saved",
    onSubmit: async (values) => {
      const conflicts = detectScheduleConflicts(items, values);
      if (conflicts.length) {
        throw new Error(conflicts[0].message);
      }
      await fleetopsService.createScheduleItem(values);
      await reload();
    },
  });

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const [rawDrivers, rawItems] = await Promise.all([
        fleetopsService.listDrivers(),
        schedulesService.listScheduleItems().catch(() => []),
      ]);
      const drivers = rawDrivers.map(mapDriverRow);
      setDriverRows(drivers);
      setItems(Array.isArray(rawItems) ? rawItems : []);
    } catch (err) {
      toast.error(err?.friendlyMessage || "Could not load schedule data.");
      setDriverRows([]);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const schedule = useMemo(() => ({ days: DAYS, drivers: buildRows(driverRows, items) }), [driverRows, items]);

  const weekStart = startOfWeek(addWeeks(new Date(), weekOffset), { weekStartsOn: 1 });
  const weekEnd = addDays(weekStart, 6);
  const weekLabel = `${format(weekStart, "MMM d")} – ${format(weekEnd, "MMM d, yyyy")}`;

  const totalShifts = schedule.drivers.reduce((s, d) => s + d.shifts.filter(Boolean).length, 0);
  const totalHours = schedule.drivers.reduce(
    (s, d) =>
      s +
      d.shifts.reduce((ss, sh) => {
        if (!sh) return ss;
        const [aa, bb] = sh.split("-").map(Number);
        if (!Number.isFinite(aa) || !Number.isFinite(bb)) return ss;
        return ss + (bb >= aa ? bb - aa : 24 - aa + bb);
      }, 0),
    0,
  );

  return (
    <div data-testid="schedule-planner-page">
      <PageHeader
        breadcrumbs={[{ label: "FleetOps", to: "/fleet-ops" }, { label: "Operations" }, { label: "Schedule" }]}
        overline="Operations"
        title={tab === "fleet" ? "Fleet schedule" : "Weekly Schedule"}
        description={
          tab === "fleet"
            ? "Order capacity scheduling by driver"
            : loading
              ? "Loading schedules…"
              : `${schedule.drivers.length} drivers · ${totalShifts} shifts from API`
        }
        actions={
          <>
            <div className="flex bg-white border border-black/[0.08] rounded-sm p-0.5 mr-2">
              <button
                type="button"
                onClick={() => setTab("shifts")}
                className={`px-3 h-8 text-xs font-medium rounded-sm ${tab === "shifts" ? "bg-[#EEF0F4] text-[#0A0E1A]" : "text-[#374151]"}`}
                data-testid="schedule-tab-shifts"
              >
                Driver shifts
              </button>
              <button
                type="button"
                onClick={() => setTab("fleet")}
                className={`px-3 h-8 text-xs font-medium rounded-sm ${tab === "fleet" ? "bg-[#EEF0F4] text-[#0A0E1A]" : "text-[#374151]"}`}
                data-testid="schedule-tab-fleet"
              >
                Fleet schedule
              </button>
            </div>
            {tab === "shifts" && (
              <>
            <div className="flex items-center gap-1 border border-black/[0.08] rounded-md px-1 h-10 bg-white" data-testid="schedule-week-nav">
              <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => setWeekOffset((w) => w - 1)}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-xs font-mono text-[#374151] px-2 flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" /> {weekLabel}
              </span>
              <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => setWeekOffset((w) => w + 1)}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            <Button variant="outline" onClick={() => reload()} className="border-black/[0.08] h-10">
              Refresh
            </Button>
            <Button onClick={() => dialog.setOpen(true)} className="bg-[#0066FF] hover:bg-[#0040CC] text-white h-10 rounded-lg shadow-[0_10px_28px_-8px_rgba(0,102,255,0.45)]" data-testid="schedule-new">
              <Plus className="h-4 w-4 mr-1.5" /> Add shift
            </Button>
              </>
            )}
          </>
        }
      />
      <div className="p-6">
        {tab === "fleet" ? (
          <FleetScheduleView weekOffset={weekOffset} />
        ) : (
          <>
        {!loading && schedule.drivers.length === 0 && (
          <div className="mb-4 text-sm text-[#4B5563]" data-testid="schedule-empty">
            No drivers loaded. Schedule rows need at least one driver in FleetOps.
          </div>
        )}
        <div className="bg-white border border-black/[0.08] rounded-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="text-left px-4 py-3 text-[10px] uppercase tracking-wider font-semibold text-[#4B5563] border-b border-black/[0.08] bg-white sticky left-0">
                    Driver
                  </th>
                  {schedule.days.map((d, i) => (
                    <th key={d} className={`text-center px-3 py-3 text-[10px] uppercase tracking-wider font-semibold border-b border-black/[0.08] ${i >= 5 ? "text-[#A16207]" : "text-[#4B5563]"}`}>
                      {d}
                    </th>
                  ))}
                  <th className="text-right px-4 py-3 text-[10px] uppercase tracking-wider font-semibold text-[#4B5563] border-b border-black/[0.08]">Hours</th>
                </tr>
              </thead>
              <tbody>
                {schedule.drivers.map((d) => {
                  const hours = d.shifts.reduce((s, sh) => {
                    if (!sh) return s;
                    const [a, b] = sh.split("-").map(Number);
                    if (!Number.isFinite(a) || !Number.isFinite(b)) return s;
                    return s + (b >= a ? b - a : 24 - a + b);
                  }, 0);
                  return (
                    <tr key={d.id} className="border-b border-black/[0.05] hover:bg-[#F5F6F8]" data-testid={`schedule-row-${d.id}`}>
                      <td className="px-4 py-3 sticky left-0 bg-white">
                        <div className="flex items-center gap-2.5">
                          <div className="h-7 w-7 bg-[#0066FF] text-white grid place-items-center rounded-md font-mono font-bold text-[10px]">
                            {String(d.name || "")
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </div>
                          <span className="font-medium text-sm whitespace-nowrap text-[#0A0E1A]">{d.name}</span>
                        </div>
                      </td>
                      {d.shifts.map((sh, i) => {
                        if (!sh)
                          return (
                            <td key={i} className="px-1 py-2 align-middle">
                              <div className="h-12 mx-1 border border-dashed border-black/[0.08] rounded-sm grid place-items-center text-[10px] font-mono uppercase tracking-wider text-[#4B5563]">
                                Off
                              </div>
                            </td>
                          );
                        const [a] = sh.split("-").map(Number);
                        const isNight = Number.isFinite(a) && (a >= 18 || a < 6);
                        return (
                          <td key={i} className="px-1 py-2 align-middle">
                            <div
                              className={`h-12 mx-1 rounded-sm grid place-items-center text-xs font-mono border ${
                                isNight ? "bg-[#0066FF]/10 border-[#0066FF]/30 text-[#0040CC]" : "bg-[#16A34A]/10 border-[#16A34A]/30 text-[#15803D]"
                              }`}
                              data-testid={`shift-${d.id}-${i}`}
                            >
                              <div className="flex items-center gap-1">
                                {isNight ? <Moon className="h-3 w-3" /> : <Sun className="h-3 w-3" />}
                                <span className="tabular">{sh}</span>
                              </div>
                            </div>
                          </td>
                        );
                      })}
                      <td className="px-4 py-3 text-right font-mono text-sm tabular text-[#0A0E1A]">{hours}h</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-3 border-t border-black/[0.08] flex items-center gap-4 text-[10px] font-mono uppercase tracking-wider text-[#4B5563]">
            <span className="flex items-center gap-1.5">
              <Sun className="h-3 w-3 text-[#15803D]" /> Day shift
            </span>
            <span className="flex items-center gap-1.5">
              <Moon className="h-3 w-3 text-[#0066FF]" /> Night shift
            </span>
            <span className="ml-auto text-[#374151]">
              {totalShifts} shifts · {totalHours} total hours (parsed)
            </span>
          </div>
        </div>
          </>
        )}
      </div>
      {tab === "shifts" && (
      <FleetOpsFormDialog
        open={dialog.open}
        onOpenChange={dialog.setOpen}
        title="Add shift"
        description="Creates a schedule item with driver, weekday, hours, and optional notes."
        submitLabel="Add shift"
        busy={dialog.busy}
        error={dialog.error}
        onSubmit={dialog.handleSubmit}
        testId="add-shift-dialog"
      >
        <ShiftForm
          ref={formRef}
          formId="shift-create-form"
          driverOptions={driverOptions}
        />
        <p className="text-[11px] font-mono text-[#6B7280] mt-2" data-testid="schedule-backend-note">
          Recurring templates and timezone rules require backend schedule APIs — not yet exposed on this tenant.
        </p>
      </FleetOpsFormDialog>
      )}
    </div>
  );
}

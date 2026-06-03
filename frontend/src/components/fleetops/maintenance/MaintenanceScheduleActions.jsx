import { useState } from "react";
import { Button } from "@/components/ui/button";
import { fleetopsService } from "@/services/fleetops";
import { toast } from "sonner";
import { Pause, Play, Zap, Calendar } from "lucide-react";
import { useFleetopsPermission } from "@/hooks/fleetops/useFleetopsPermission";

export default function MaintenanceScheduleActions({ scheduleId, onChanged }) {
  const [busy, setBusy] = useState(false);
  const { can } = useFleetopsPermission();
  const canManage = can("update", "maintenance");

  if (!canManage) return null;

  const run = async (action, label) => {
    setBusy(true);
    try {
      if (action === "pause") await fleetopsService.pauseMaintenanceSchedule(scheduleId);
      else if (action === "resume") await fleetopsService.resumeMaintenanceSchedule(scheduleId);
      else if (action === "trigger") await fleetopsService.triggerMaintenanceSchedule(scheduleId);
      else if (action === "ical") {
        const data = await fleetopsService.getMaintenanceScheduleIcal(scheduleId);
        const blob = new Blob([typeof data === "string" ? data : JSON.stringify(data)], { type: "text/calendar" });
        fleetopsService.downloadExportBlob(blob, `schedule-${scheduleId}.ics`);
      }
      toast.success(label);
      onChanged?.();
    } catch (err) {
      toast.error(err?.friendlyMessage || `${label} failed`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-wrap gap-2 mt-4" data-testid="maintenance-schedule-actions">
      <Button variant="outline" size="sm" disabled={busy} onClick={() => run("pause", "Schedule paused")} data-testid="schedule-pause">
        <Pause className="h-3.5 w-3.5 mr-1" /> Pause
      </Button>
      <Button variant="outline" size="sm" disabled={busy} onClick={() => run("resume", "Schedule resumed")} data-testid="schedule-resume">
        <Play className="h-3.5 w-3.5 mr-1" /> Resume
      </Button>
      <Button variant="outline" size="sm" disabled={busy} onClick={() => run("trigger", "Schedule triggered")} data-testid="schedule-trigger">
        <Zap className="h-3.5 w-3.5 mr-1" /> Trigger now
      </Button>
      <Button variant="outline" size="sm" disabled={busy} onClick={() => run("ical", "iCal downloaded")} data-testid="schedule-ical">
        <Calendar className="h-3.5 w-3.5 mr-1" /> Download iCal
      </Button>
    </div>
  );
}

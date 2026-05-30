import { useMemo } from "react";
import { TableSkeleton } from "@/components/loaders";
import { useDetailTabData } from "@/hooks/fleetops/useDetailTabData";
import { schedulesService } from "@/services/schedules";

async function loadDriverSchedule(driverId) {
  try {
    return await schedulesService.listScheduleItems({ driver: driverId });
  } catch {
    try {
      return await schedulesService.listScheduleItems({ driver_uuid: driverId });
    } catch {
      return [];
    }
  }
}

export default function DriverScheduleTab({ driverId, enabled }) {
  const { data: items, loading } = useDetailTabData(
    `driver-schedule-${driverId}`,
    () => loadDriverSchedule(driverId),
    { enabled: enabled && Boolean(driverId) },
  );

  const weekPreview = useMemo(() => {
    if (!items?.length) {
      return ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day, i) => ({
        day,
        text: i < 5 ? "No shifts" : "Off",
      }));
    }
    return ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => ({
      day,
      text: `${items.length} item(s)`,
    }));
  }, [items]);

  if (loading) {
    return (
      <div className="p-4">
        <TableSkeleton rows={3} testId="driver-schedule-skeleton" />
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <div className="bg-white border border-black/[0.08] rounded-md p-5 grid grid-cols-7 gap-2 text-xs">
        {weekPreview.map(({ day, text }, i) => (
          <div
            key={day}
            className={`border border-black/[0.08] rounded-sm p-3 ${i < 5 ? "bg-blue-500/5" : "bg-[#F1F2F5]/40"}`}
          >
            <div className="overline">{day}</div>
            <div className="font-mono text-[#1F2937] mt-2">{text}</div>
          </div>
        ))}
      </div>
      <div className="bg-white border border-black/[0.08] rounded-md divide-y divide-black/[0.08]">
        {!items?.length ? (
          <div className="p-6 text-sm text-[#4B5563] text-center">No schedule items for this driver.</div>
        ) : (
          items.map((item) => (
            <div key={item.id || item.uuid} className="px-4 py-3 text-sm">
              <div className="font-medium">{item.title || item.name || "Shift"}</div>
              <div className="text-xs font-mono text-[#4B5563] mt-1">
                {item.start_at || item.starts_at || "—"} → {item.end_at || item.ends_at || "—"}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

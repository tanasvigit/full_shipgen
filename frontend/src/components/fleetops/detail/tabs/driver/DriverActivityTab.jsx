import ActivityTimeline from "@/components/activity/ActivityTimeline";
import { useDetailTabData } from "@/hooks/fleetops/useDetailTabData";
import { fleetopsService } from "@/services/fleetops";
import { eventsFromOrder } from "@/domain/fleetops/events/transformers";

function mapActivityRows(rows, driverId) {
  return (rows || [])
    .filter((row) => {
      const subject = row.subject_uuid || row.driver_uuid || row.driver_id;
      return !subject || String(subject) === String(driverId);
    })
    .map((row, i) => ({
      id: row.id || row.uuid || `act-${i}`,
      code: row.code || row.type || row.event,
      title: row.title || row.description || row.message || row.code || "Activity",
      timestamp: row.created_at || row.timestamp,
      meta: row.meta,
    }));
}

export default function DriverActivityTab({ driverId, driverApi, enabled }) {
  const { data: events, loading } = useDetailTabData(
    `driver-activity-${driverId}`,
    async () => {
      const activities = await fleetopsService.listActivities({
        subject_uuid: driverId,
        driver: driverId,
        limit: 100,
      });
      const mapped = mapActivityRows(activities, driverId);
      if (mapped.length) return mapped;
      const orderEvents = eventsFromOrder({ activities: driverApi?.activities, logs: driverApi?.logs });
      return orderEvents;
    },
    { enabled: enabled && Boolean(driverId) },
  );

  return (
    <div className="p-4">
      <div className="bg-white border border-black/[0.08] rounded-md p-5">
        <ActivityTimeline events={events || []} loading={loading} testId="driver-activity-timeline" />
      </div>
    </div>
  );
}

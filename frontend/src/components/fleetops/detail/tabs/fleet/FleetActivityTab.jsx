import ActivityTimeline from "@/components/activity/ActivityTimeline";
import { useDetailTabData } from "@/hooks/fleetops/useDetailTabData";
import { fleetopsService } from "@/services/fleetops";

function mapActivityRows(rows, fleetId) {
  return (rows || [])
    .filter((row) => {
      const subject = row.subject_uuid || row.fleet_uuid;
      return !subject || String(subject) === String(fleetId);
    })
    .map((row, i) => ({
      id: row.id || row.uuid || `act-${i}`,
      code: row.code || row.event || row.log_name || "activity",
      title: row.title || row.description || row.message || row.log_name || "Activity",
      timestamp: row.created_at || row.timestamp,
      meta: row.properties || row.meta,
    }));
}

export default function FleetActivityTab({ fleetId, enabled }) {
  const { data: events, loading } = useDetailTabData(
    `fleet-activity-${fleetId}`,
    async () => {
      const activities = await fleetopsService.listActivities({
        subject_uuid: fleetId,
        fleet: fleetId,
        limit: 100,
      });
      return mapActivityRows(activities, fleetId);
    },
    { enabled: enabled && Boolean(fleetId) },
  );

  return (
    <div className="p-4">
      <div className="bg-white border border-black/[0.08] rounded-md p-5">
        <ActivityTimeline events={events || []} loading={loading} testId="fleet-activity-timeline" />
      </div>
    </div>
  );
}

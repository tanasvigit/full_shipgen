import ActivityTimeline from "@/components/activity/ActivityTimeline";
import { useDetailTabData } from "@/hooks/fleetops/useDetailTabData";
import { queryGeofenceEvents } from "@/lib/fleetops/detailApi";

export default function PlaceActivityTab({ placeId, enabled }) {
  const { data: events, loading } = useDetailTabData(
    `place-activity-${placeId}`,
    async () => {
      const rows = await queryGeofenceEvents({ place_uuid: placeId, limit: 50 });
      return (rows || []).map((row, i) => ({
        id: row.id || row.uuid || `geo-${i}`,
        code: row.type || row.event || "geofence",
        title: row.description || row.message || row.type || "Geofence event",
        timestamp: row.created_at || row.occurred_at,
      }));
    },
    { enabled: enabled && Boolean(placeId) },
  );

  return (
    <div className="p-4">
      <div className="bg-white border border-black/[0.08] rounded-md p-5">
        <ActivityTimeline events={events || []} loading={loading} testId="place-activity-timeline" />
      </div>
    </div>
  );
}

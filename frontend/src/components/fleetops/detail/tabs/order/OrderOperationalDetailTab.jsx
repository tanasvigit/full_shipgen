import StatusBadge from "@/components/common/StatusBadge";
import DetailEntityLink from "@/components/fleetops/detail/DetailEntityLink";
import DetailFieldGrid from "@/components/fleetops/detail/DetailFieldGrid";
import { statusLabel } from "@/lib/mappers";

export default function OrderOperationalDetailTab({ order, rawOrder, driver, vehicle }) {
  const raw = rawOrder || {};
  const fields = [
    { label: "Public ID", value: order?.publicId, mono: true },
    { label: "Internal ID", value: raw.internal_id || order?.internalId, mono: true },
    { label: "Tracking", value: order?.trackingNumber || raw.tracking_number, mono: true },
    {
      label: "Status",
      value: <StatusBadge status={order?.status} label={statusLabel(order?.status)} />,
    },
    { label: "Priority", value: raw.orchestrator_priority || order?.priority },
    { label: "Type", value: raw.type || "—" },
    { label: "Ad-hoc", value: raw.adhoc ? "Yes" : "No" },
    { label: "Multi-drop", value: raw.is_multi_drop || raw.isMultiDrop ? "Yes" : "No" },
    { label: "POD required", value: raw.pod_required ? "Yes" : "No" },
    { label: "Scheduled", value: raw.scheduled_at ? new Date(raw.scheduled_at).toLocaleString() : "—" },
    { label: "Dispatched", value: raw.dispatched_at ? new Date(raw.dispatched_at).toLocaleString() : "—" },
    { label: "Started", value: raw.started_at ? new Date(raw.started_at).toLocaleString() : "—" },
    { label: "Completed", value: raw.completed_at ? new Date(raw.completed_at).toLocaleString() : "—" },
    {
      label: "Time window",
      value:
        raw.time_window_start || raw.time_window_end
          ? `${raw.time_window_start || "—"} → ${raw.time_window_end || "—"}`
          : "—",
    },
    {
      label: "Required skills",
      value: (raw.required_skills || []).length ? raw.required_skills.join(", ") : "—",
    },
    {
      label: "Driver",
      value: driver?.id ? (
        <DetailEntityLink entityKey="driver" entityId={driver.id}>
          {driver.name}
        </DetailEntityLink>
      ) : (
        "—"
      ),
    },
    {
      label: "Vehicle",
      value: vehicle?.id ? (
        <DetailEntityLink entityKey="vehicle" entityId={vehicle.id}>
          {vehicle.name}
        </DetailEntityLink>
      ) : (
        "—"
      ),
    },
    { label: "Customer", value: order?.customer?.name },
    { label: "Facilitator", value: raw.facilitator?.name || raw.vendor?.name || "—" },
  ];

  return (
    <div className="p-4">
      <div className="bg-white border border-black/[0.08] rounded-md p-5">
        <DetailFieldGrid fields={fields} columns={2} />
      </div>
    </div>
  );
}

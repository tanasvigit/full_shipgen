import StatusBadge from "@/components/common/StatusBadge";
import DetailFieldGrid from "@/components/fleetops/detail/DetailFieldGrid";
import { statusLabel } from "@/lib/mappers";

export default function DriverOverviewTab({ driver, driverApi }) {
  const d = driver;
  const raw = driverApi || {};
  const name =
    d?.name ||
    [raw.first_name, raw.last_name].filter(Boolean).join(" ") ||
    "—";
  const coords = raw.location || raw.coordinates;
  const coordLabel =
    coords?.latitude != null && coords?.longitude != null
      ? `${Number(coords.latitude).toFixed(4)}, ${Number(coords.longitude).toFixed(4)}`
      : d?.location?.label || "—";

  const fields = [
    { label: "Name", value: name },
    { label: "Email", value: d?.email || raw.email },
    { label: "Phone", value: d?.phone || raw.phone },
    { label: "Public ID", value: d?.publicId, mono: true },
    { label: "Internal ID", value: d?.internalId || raw.internal_id, mono: true },
    {
      label: "Status",
      value: d?.status ? <StatusBadge status={d.status} label={statusLabel(d.status)} /> : "—",
    },
    {
      label: "Online state",
      value: raw.online_status || raw.connection_status || raw.status || "—",
    },
    { label: "Shift state", value: raw.shift_status || raw.on_duty_status || "—" },
    { label: "License", value: d?.licenseNumber || raw.drivers_license_number, mono: true },
    { label: "License expiry", value: raw.drivers_license_expiry || raw.license_expiry || "—" },
    { label: "City", value: raw.city || "—" },
    { label: "Country", value: raw.country || "—" },
    { label: "Coordinates", value: coordLabel, mono: true },
    {
      label: "Max travel time",
      value: raw.max_travel_time ? `${raw.max_travel_time}` : raw.max_travel_time_hours ? `${raw.max_travel_time_hours}h` : "—",
    },
    {
      label: "Max distance",
      value: raw.max_distance ? `${raw.max_distance} km` : "—",
    },
    {
      label: "Max payload",
      value: raw.max_load_weight || raw.max_payload || "—",
    },
    { label: "Fleet", value: raw.fleet?.name || raw.fleet_name || "—" },
    { label: "Facilitator / vendor", value: raw.vendor?.name || raw.facilitator?.name || "—" },
    {
      label: "Skills",
      value: (raw.skills || d?.skills || []).length
        ? (raw.skills || d.skills).join(", ")
        : "—",
    },
    {
      label: "Certifications",
      value: (raw.certifications || []).length ? raw.certifications.join(", ") : "—",
    },
    { label: "Rating", value: Number(d?.rating || 0).toFixed(1) },
    { label: "Orders completed", value: Number(d?.ordersCompleted || 0).toLocaleString() },
    { label: "Created", value: raw.created_at ? new Date(raw.created_at).toLocaleString() : "—", mono: true },
    { label: "Updated", value: raw.updated_at ? new Date(raw.updated_at).toLocaleString() : "—", mono: true },
    { label: "Created by", value: raw.created_by?.name || raw.creator?.name || "—" },
    { label: "Updated by", value: raw.updated_by?.name || raw.updater?.name || "—" },
  ];

  return (
    <div className="p-4 space-y-4">
      <div className="bg-white border border-black/[0.08] rounded-md p-5">
        <DetailFieldGrid fields={fields} columns={2} />
      </div>
      {raw.meta && Object.keys(raw.meta).length > 0 && (
        <div className="bg-white border border-black/[0.08] rounded-md p-5">
          <div className="overline mb-2">Metadata</div>
          <pre className="text-xs font-mono bg-[#F5F6F8] p-3 rounded overflow-auto max-h-48">
            {JSON.stringify(raw.meta, null, 2)}
          </pre>
        </div>
      )}
      {(raw.custom_fields || raw.customFieldValues)?.length > 0 && (
        <div className="bg-white border border-black/[0.08] rounded-md p-5">
          <div className="overline mb-2">Custom fields</div>
          <DetailFieldGrid
            fields={(raw.custom_fields || raw.customFieldValues).map((cf) => ({
              label: cf.label || cf.name || cf.key,
              value: cf.value ?? "—",
            }))}
          />
        </div>
      )}
    </div>
  );
}

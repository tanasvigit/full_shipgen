import DetailFieldGrid from "@/components/fleetops/detail/DetailFieldGrid";

export default function OrderPayloadTab({ rawOrder }) {
  const raw = rawOrder || {};
  const payload = raw.payload || raw.order_payload;
  const entities = payload?.entities || payload?.items || raw.entities || [];

  return (
    <div className="p-4 space-y-4">
      <div className="bg-white border border-black/[0.08] rounded-md p-5">
        <div className="overline mb-3">Payload</div>
        {payload?.tracking_number && (
          <p className="text-sm font-mono mb-2">Tracking: {payload.tracking_number}</p>
        )}
        {!entities?.length ? (
          <p className="text-sm text-[#4B5563]">No payload entities on this order.</p>
        ) : (
          <div className="divide-y divide-black/[0.08]">
            {entities.map((entity, i) => (
              <div key={entity.id || entity.uuid || i} className="py-3">
                <div className="font-medium text-sm">{entity.name || entity.description || "Item"}</div>
                <DetailFieldGrid
                  fields={[
                    { label: "SKU", value: entity.sku || entity.code, mono: true },
                    { label: "Qty", value: entity.quantity ?? entity.qty ?? "—" },
                    { label: "Weight", value: entity.weight ?? "—" },
                  ]}
                  columns={3}
                />
              </div>
            ))}
          </div>
        )}
      </div>
      {raw.waypoints?.length > 0 && (
        <div className="bg-white border border-black/[0.08] rounded-md p-5">
          <div className="overline mb-3">Waypoints</div>
          <div className="space-y-2 text-sm">
            {raw.waypoints.map((wp, i) => (
              <div key={wp.id || i} className="font-mono text-xs border border-black/[0.06] rounded p-2">
                {wp.type || "stop"} · {wp.place?.name || wp.address || wp.id}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

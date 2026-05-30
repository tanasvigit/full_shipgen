import DetailFieldGrid from "@/components/fleetops/detail/DetailFieldGrid";
import DetailEntityLink from "@/components/fleetops/detail/DetailEntityLink";

export default function OrderIntegratedVendorTab({ rawOrder }) {
  const iv =
    rawOrder?.integrated_vendor ||
    rawOrder?.integratedVendor ||
    rawOrder?.integrated_vendor_order;

  return (
    <div className="p-4">
      <div className="bg-white border border-black/[0.08] rounded-md p-5">
        {!iv ? (
          <p className="text-sm text-[#4B5563]">No integrated vendor assignment on this order.</p>
        ) : (
          <DetailFieldGrid
            fields={[
              { label: "Vendor", value: iv.name || iv.vendor?.name || "—" },
              { label: "External ID", value: iv.external_id || iv.reference, mono: true },
              { label: "Status", value: iv.status || "—" },
              {
                label: "Vendor record",
                value:
                  iv.vendor_uuid || iv.vendor?.uuid ? (
                    <DetailEntityLink entityKey="order" entityId={iv.vendor_uuid}>
                      Open vendor context
                    </DetailEntityLink>
                  ) : (
                    "—"
                  ),
              },
            ]}
          />
        )}
      </div>
    </div>
  );
}

import DetailFieldGrid from "@/components/fleetops/detail/DetailFieldGrid";

export default function OrderCustomFieldsTab({ rawOrder }) {
  const fields = rawOrder?.custom_fields || rawOrder?.customFieldValues || [];

  return (
    <div className="p-4">
      <div className="bg-white border border-black/[0.08] rounded-md p-5">
        {!fields?.length ? (
          <p className="text-sm text-[#4B5563]">No custom fields configured for this order.</p>
        ) : (
          <DetailFieldGrid
            fields={fields.map((cf) => ({
              label: cf.label || cf.name || cf.key,
              value: cf.value ?? cf.display_value ?? "—",
            }))}
          />
        )}
      </div>
    </div>
  );
}

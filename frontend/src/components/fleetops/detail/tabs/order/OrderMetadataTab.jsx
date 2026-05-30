import DetailFieldGrid from "@/components/fleetops/detail/DetailFieldGrid";
import { Button } from "@/components/ui/button";

export default function OrderMetadataTab({ rawOrder, editable = false, onEdit }) {
  const meta = rawOrder?.meta || rawOrder?.metadata || {};

  return (
    <div className="p-4">
      <div className="bg-white border border-black/[0.08] rounded-md p-5">
        {editable && (
          <div className="flex justify-end mb-3">
            <Button size="sm" variant="outline" className="h-8" onClick={onEdit} data-testid="order-metadata-edit">
              Edit metadata
            </Button>
          </div>
        )}
        {Object.keys(meta).length === 0 ? (
          <p className="text-sm text-[#4B5563]">No metadata on this order.</p>
        ) : (
          <>
            <DetailFieldGrid
              fields={Object.entries(meta).map(([k, v]) => ({
                label: k,
                value: typeof v === "object" ? JSON.stringify(v) : String(v),
                mono: true,
              }))}
            />
            <pre className="text-xs font-mono bg-[#F5F6F8] p-3 rounded mt-4 overflow-auto max-h-64">
              {JSON.stringify(meta, null, 2)}
            </pre>
          </>
        )}
      </div>
    </div>
  );
}

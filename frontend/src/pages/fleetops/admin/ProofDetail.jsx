import FleetopsCrudDetailPage from "@/components/fleetops/crud/FleetopsCrudDetailPage";
import { CRUD_ENTITIES } from "@/lib/fleetops/crudEntities";

function ProofFilePanel({ raw }) {
  const url = raw?.url || raw?.file_url || raw?.file?.url || raw?.file?.original_url;
  if (!url) return null;
  const isImage = /\.(jpe?g|png|gif|webp)(\?|$)/i.test(url);
  return (
    <section className="rounded-md border border-black/[0.08] p-4 space-y-3" data-testid="proof-file-panel">
      <div className="overline">Proof attachment</div>
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="text-[#0066FF] text-sm font-medium hover:underline"
        data-testid="proof-file-link"
      >
        Open file in new tab
      </a>
      {isImage ? (
        <img
          src={url}
          alt="Proof of delivery"
          className="max-h-64 rounded border border-black/[0.08] object-contain"
          data-testid="proof-file-preview"
        />
      ) : null}
    </section>
  );
}

export default function ProofDetail({ embedded = false, entityId, onClose }) {
  return (
    <FleetopsCrudDetailPage
      embedded={embedded}
      entityId={entityId}
      onClose={onClose}
      config={CRUD_ENTITIES.proof}
      detailExtras={(raw) => <ProofFilePanel raw={raw} />}
    />
  );
}

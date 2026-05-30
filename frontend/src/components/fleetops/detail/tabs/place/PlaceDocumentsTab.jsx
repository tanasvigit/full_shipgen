export default function PlaceDocumentsTab({ placeId }) {
  return (
    <div className="p-4 m-4 bg-white border border-black/[0.08] rounded-md text-sm text-[#374151]" data-testid="place-documents-tab">
      <p className="text-[#4B5563]">Documents linked to this place appear here (MVP list placeholder).</p>
      <ul className="mt-3 space-y-1 font-mono text-xs text-[#6B7280]">
        <li>delivery_instructions.pdf — pending upload</li>
        <li>dock_permit.pdf — pending upload</li>
      </ul>
    </div>
  );
}

export default function PlaceRulesTab({ placeId }) {
  return (
    <div className="p-4 m-4 bg-white border border-black/[0.08] rounded-md text-sm text-[#374151]" data-testid="place-rules-tab">
      <div className="overline mb-2">Access rules</div>
      <p className="text-[#4B5563]">Geofence and delivery rules for place {placeId || "—"} (MVP).</p>
      <ul className="mt-3 list-disc pl-5 text-xs text-[#374151] space-y-1">
        <li>Check-in required at arrival</li>
        <li>Photo POD optional</li>
      </ul>
    </div>
  );
}

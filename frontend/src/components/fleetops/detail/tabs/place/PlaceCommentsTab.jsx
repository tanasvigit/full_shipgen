export default function PlaceCommentsTab({ placeId }) {
  return (
    <div className="p-4 m-4 bg-white border border-black/[0.08] rounded-md text-sm text-[#374151]" data-testid="place-comments-tab">
      <p className="text-[#4B5563] mb-2">Operational comments for place {placeId || "—"}.</p>
      <p className="italic text-[#6B7280]">No comments yet. Add notes from place edit when the API supports inline comments.</p>
    </div>
  );
}

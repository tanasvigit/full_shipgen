/**
 * Progressive disclosure placeholder for tabs not yet fully implemented.
 */
export default function DetailPlaceholderTab({ title, description, fields = [] }) {
  return (
    <div className="p-4">
      <div className="bg-white border border-black/[0.08] rounded-lg p-6">
        <h3 className="font-display font-semibold text-[#0A0E1A]">{title}</h3>
        <p className="text-sm text-[#4B5563] mt-2">{description}</p>
        {fields.length > 0 && (
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
            {fields.map((field) => (
              <div
                key={field}
                className="text-xs font-mono text-[#374151] px-3 py-2 rounded-md bg-[#F5F6F8] border border-black/[0.06]"
              >
                {field}
              </div>
            ))}
          </div>
        )}
        <p className="text-[11px] text-[#6B7280] mt-4 font-mono uppercase tracking-wider">
          API contracts preserved · UI surfacing in progress
        </p>
      </div>
    </div>
  );
}

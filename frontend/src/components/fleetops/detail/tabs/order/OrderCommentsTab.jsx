import { useDetailTabData } from "@/hooks/fleetops/useDetailTabData";
import { fleetopsService } from "@/services/fleetops";
import { TableSkeleton } from "@/components/loaders";

export default function OrderCommentsTab({ orderId, enabled }) {
  const { data: comments, loading } = useDetailTabData(
    `order-comments-${orderId}`,
    () => fleetopsService.listOrderComments(orderId),
    { enabled: enabled && Boolean(orderId) },
  );

  if (loading) {
    return (
      <div className="p-4">
        <TableSkeleton rows={4} testId="order-comments-skeleton" />
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="bg-white border border-black/[0.08] rounded-md divide-y divide-black/[0.08]">
        {!comments?.length ? (
          <div className="p-6 text-sm text-[#4B5563] text-center">No customer communication on this order yet.</div>
        ) : (
          comments.map((c, i) => (
            <div key={c.id || c.uuid || i} className="px-4 py-3">
              <div className="text-xs font-mono text-[#4B5563]">
                {c.created_at ? new Date(c.created_at).toLocaleString() : "—"} · {c.author?.name || c.user?.name || "System"}
              </div>
              <p className="text-sm text-[#1F2937] mt-1 whitespace-pre-wrap">{c.body || c.content || c.message}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

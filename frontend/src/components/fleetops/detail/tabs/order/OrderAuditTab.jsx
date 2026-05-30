import { useDetailTabData } from "@/hooks/fleetops/useDetailTabData";
import { developersService } from "@/services/developers";
import { TableSkeleton } from "@/components/loaders";

export default function OrderAuditTab({ orderId, enabled }) {
  const { data: logs, loading } = useDetailTabData(
    `order-audit-${orderId}`,
    () =>
      developersService.listWebhookRequestLogs({
        limit: 50,
        subject_uuid: orderId,
        resource_uuid: orderId,
      }),
    { enabled: enabled && Boolean(orderId) },
  );

  if (loading) {
    return (
      <div className="p-4">
        <TableSkeleton rows={5} testId="order-audit-skeleton" />
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <div className="bg-white border border-black/[0.08] rounded-md divide-y divide-black/[0.08]">
        {!logs?.length ? (
          <div className="p-6 text-sm text-[#4B5563] text-center">
            No webhook or API logs matched this order. Configure webhooks under Developers → Webhooks.
          </div>
        ) : (
          logs.map((log, i) => (
            <div key={log.id || log.uuid || i} className="px-4 py-3 text-sm">
              <div className="flex items-center gap-2 font-mono text-xs">
                <span className={log.status >= 400 ? "text-red-600" : "text-emerald-700"}>
                  {log.status || log.response_code || "—"}
                </span>
                <span className="text-[#4B5563]">{log.method || "POST"}</span>
                <span className="truncate text-[#1F2937]">{log.url || log.endpoint || "—"}</span>
              </div>
              <div className="text-[10px] text-[#6B7280] mt-1">
                {log.created_at ? new Date(log.created_at).toLocaleString() : "—"}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

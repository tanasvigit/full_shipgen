import { useState } from "react";
import PageHeader from "@/components/common/PageHeader";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import StatusBadge from "@/components/common/StatusBadge";
import { fleetopsService } from "@/services/fleetops";
import { parseApiError } from "@/lib/errors";
import { scalarLabel } from "@/lib/fleetops/crudEntities";

export default function TrackOrderLookup() {
  const [trackingNumber, setTrackingNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [order, setOrder] = useState(null);
  const [error, setError] = useState("");
  const [searched, setSearched] = useState(false);

  const search = async () => {
    setLoading(true);
    setSearched(true);
    setError("");
    setOrder(null);
    try {
      const result = await fleetopsService.lookupTrackingOrder(trackingNumber);
      setOrder(result || null);
      if (!result) setError("No order found for that tracking number.");
    } catch (err) {
      setOrder(null);
      setError(parseApiError(err, "No order found for that tracking number."));
    } finally {
      setLoading(false);
    }
  };

  const trackingLabel =
    scalarLabel(order?.tracking_number) ||
    scalarLabel(order?.trackingNumber) ||
    trackingNumber;

  const statuses = order?.tracking_statuses || order?.trackingStatuses || [];

  return (
    <div data-testid="tracking-lookup-page">
      <PageHeader
        overline="Guest tracking"
        title="Track order"
        description="Lookup an order by its tracking number via the FleetOps tracking API."
      />
      <div className="p-6 max-w-2xl space-y-4">
        <div className="flex gap-2">
          <Input
            value={trackingNumber}
            onChange={(e) => setTrackingNumber(e.target.value)}
            placeholder="Tracking number"
            data-testid="tracking-lookup-input"
            onKeyDown={(e) => {
              if (e.key === "Enter" && trackingNumber.trim()) void search();
            }}
          />
          <Button onClick={search} disabled={loading || !trackingNumber.trim()} data-testid="tracking-lookup-button">
            {loading ? "Searching…" : "Lookup"}
          </Button>
        </div>
        {searched && !order && !loading && (
          <div className="rounded-md border border-black/[0.08] p-4 text-sm text-[#4B5563]" data-testid="tracking-lookup-empty">
            {error || "No order found for that tracking number."}
          </div>
        )}
        {order && (
          <div className="rounded-md border border-black/[0.08] p-4 space-y-3" data-testid="tracking-lookup-result">
            <div className="text-xs font-mono text-[#6B7280]">{order.public_id || order.publicId || order.id}</div>
            <div className="font-semibold text-[#0A0E1A]">{order.customer?.name || order.name || "Order"}</div>
            <div className="text-sm text-[#4B5563]">
              Tracking: <span className="font-mono">{trackingLabel}</span>
            </div>
            <StatusBadge status={order.status || "active"} label={String(order.status || "active")} />
            {statuses.length > 0 && (
              <ul className="space-y-1 pt-2 border-t border-black/[0.06]">
                {statuses.map((row, index) => (
                  <li key={row.uuid || row.id || index} className="text-sm text-[#374151]">
                    <span className="font-medium">{scalarLabel(row.status) || scalarLabel(row.code) || "Update"}</span>
                    {row.details ? ` — ${row.details}` : ""}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

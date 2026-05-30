import { useState } from "react";
import PageHeader from "@/components/common/PageHeader";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import StatusBadge from "@/components/common/StatusBadge";
import { fleetopsService } from "@/services/fleetops";

export default function TrackOrderLookup() {
  const [trackingNumber, setTrackingNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [order, setOrder] = useState(null);
  const [searched, setSearched] = useState(false);

  const search = async () => {
    setLoading(true);
    setSearched(true);
    const result = await fleetopsService.lookupTrackingOrder(trackingNumber).catch(() => null);
    setOrder(result || null);
    setLoading(false);
  };

  return (
    <div data-testid="tracking-lookup-page">
      <PageHeader
        overline="Guest tracking"
        title="Track order"
        description="Lookup an order by tracking number using a lightweight guest-safe flow."
      />
      <div className="p-6 max-w-2xl space-y-4">
        <div className="flex gap-2">
          <Input
            value={trackingNumber}
            onChange={(e) => setTrackingNumber(e.target.value)}
            placeholder="Tracking number"
            data-testid="tracking-lookup-input"
          />
          <Button onClick={search} disabled={loading || !trackingNumber.trim()} data-testid="tracking-lookup-button">
            Lookup
          </Button>
        </div>
        {searched && !order && !loading && (
          <div className="rounded-md border border-black/[0.08] p-4 text-sm text-[#4B5563]" data-testid="tracking-lookup-empty">
            No order found for that tracking number.
          </div>
        )}
        {order && (
          <div className="rounded-md border border-black/[0.08] p-4 space-y-2" data-testid="tracking-lookup-result">
            <div className="text-xs font-mono text-[#6B7280]">{order.public_id || order.publicId || order.id}</div>
            <div className="font-semibold text-[#0A0E1A]">{order.customer?.name || order.name || "Order"}</div>
            <StatusBadge status={order.status || "active"} label={String(order.status || "active")} />
          </div>
        )}
      </div>
    </div>
  );
}

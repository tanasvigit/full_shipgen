import { useCallback, useEffect, useMemo, useState } from "react";
import DataTable from "@/components/common/DataTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { fleetopsService } from "@/services/fleetops";
import { parseApiError } from "@/lib/errors";
import { toast } from "sonner";
import { RefreshCw } from "lucide-react";

function orderRowKey(row) {
  return String(row.public_id || row.publicId || row.uuid || row.id);
}

function orderPublicId(row) {
  return row.public_id || row.publicId || row.uuid || row.id;
}

/**
 * Select orders to include in a route plan (routes module entry — not orders map flow).
 */
export default function RouteOrderPicker({
  selectedKeys,
  onSelectedKeysChange,
  onContinue,
  continueLabel = "Continue",
  disabled = false,
}) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const rows = await fleetopsService.listOrchestratorOrders({}).catch(() => fleetopsService.listOrders());
      const open = (rows || []).filter((row) => {
        const status = String(row.status || "").toLowerCase();
        return !["delivered", "canceled", "cancelled", "completed"].includes(status);
      });
      setOrders(open);
    } catch (err) {
      toast.error(parseApiError(err, "Failed to load orders"));
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return orders;
    return orders.filter((row) => {
      const haystack = [
        row.public_id,
        row.tracking_number,
        row.customer?.name,
        row.payload?.pickup?.name,
        row.payload?.dropoff?.name,
        row.driver?.name,
        row.driver_assigned?.name,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [orders, search]);

  const selectedCount = selectedKeys?.size ?? 0;

  const tableRows = useMemo(
    () => filtered.map((row) => ({ ...row, id: orderRowKey(row) })),
    [filtered],
  );

  const columns = [
    {
      key: "public_id",
      header: "Order",
      render: (row) => (
        <span className="font-mono text-xs text-[#0066FF]">{orderPublicId(row)}</span>
      ),
    },
    { key: "status", header: "Status", render: (row) => row.status || "—" },
    {
      key: "customer",
      header: "Customer",
      render: (row) => row.customer?.name || "—",
    },
    {
      key: "pickup",
      header: "Pickup",
      render: (row) => row.payload?.pickup?.name || row.pickup?.name || "—",
    },
    {
      key: "dropoff",
      header: "Dropoff",
      render: (row) => row.payload?.dropoff?.name || row.dropoff?.name || "—",
    },
    {
      key: "driver",
      header: "Driver",
      render: (row) => row.driver_assigned?.name || row.driver?.name || "—",
    },
  ];

  return (
    <div className="space-y-3" data-testid="route-order-picker">
      <div className="flex flex-wrap items-center gap-2">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search orders…"
          className="h-9 max-w-xs text-sm"
          data-testid="route-order-picker-search"
        />
        <Button type="button" variant="outline" size="sm" className="h-9" onClick={load} disabled={loading}>
          <RefreshCw className={`h-3.5 w-3.5 mr-1 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
        <span className="text-xs text-[#4B5563] ml-auto">
          {selectedCount} selected · {filtered.length} available
        </span>
      </div>

      <DataTable
        testid="route-order-picker-table"
        columns={columns}
        data={tableRows}
        loading={loading}
        pageSize={10}
        selectable
        selectedKeys={selectedKeys}
        onSelectedKeysChange={onSelectedKeysChange}
      />

      <div className="flex justify-end">
        <Button
          type="button"
          disabled={disabled || loading || selectedCount === 0}
          onClick={onContinue}
          data-testid="route-order-picker-continue"
        >
          {continueLabel}
          {selectedCount > 0 ? ` (${selectedCount})` : ""}
        </Button>
      </div>
    </div>
  );
}

export { orderPublicId, orderRowKey };

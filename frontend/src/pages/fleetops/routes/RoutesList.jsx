import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useFleetopsDetailDrawer } from "@/hooks/fleetops/useFleetopsDetailDrawer";
import PageHeader from "@/components/common/PageHeader";
import DataTable from "@/components/common/DataTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, RefreshCw } from "lucide-react";
import { fleetopsService } from "@/services/fleetops";
import { resolveOrderIdsFromRoute, resolveRoutePickupDropoff } from "@/lib/fleetops/routing";
import RouteRowActions from "@/components/fleetops/routing/RouteRowActions";
import { useFleetopsAbility } from "@/hooks/fleetops/useFleetopsAbility";
import { toast } from "sonner";
import { parseApiError } from "@/lib/errors";

export default function RoutesList() {
  const navigate = useNavigate();
  const { openDetail } = useFleetopsDetailDrawer("route");
  const ability = useFleetopsAbility();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const pageSize = 25;

  const canPlan = ability.canUpdateOrder || ability.isDispatcher;
  const canManageRoutes = canPlan || ability.can("list", "route");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setRows(await fleetopsService.listRoutes({ page, limit: pageSize }));
    } catch (err) {
      toast.error(parseApiError(err, "Failed to load routes"));
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((row) => {
      const { pickup, dropoff } = resolveRoutePickupDropoff(row);
      const haystack = [
        row.public_id,
        row.order_public_id,
        row.tracking_number,
        row.status,
        row.order_status,
        row.driver?.name,
        row.driver?.public_id,
        pickup,
        dropoff,
        row.payload?.pickup_name,
        row.payload?.dropoff_name,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [rows, search]);

  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);
  const lastPage = Math.max(1, Math.ceil(filtered.length / pageSize));

  const routeId = (row) => row.uuid || row.id || row.public_id;

  const columns = [
    {
      key: "id",
      header: "Route",
      sortable: true,
      render: (row) => {
        const rid = routeId(row);
        return (
          <button
            type="button"
            className="text-[#0066FF] font-mono text-xs hover:underline text-left"
            onClick={(e) => {
              e.stopPropagation();
              openDetail(rid);
            }}
          >
            {row.public_id || row.order_public_id || row.tracking_number || rid}
          </button>
        );
      },
    },
    { key: "status", header: "Status", sortable: true, render: (row) => row.status || row.order_status || "—" },
    {
      key: "driver",
      header: "Driver",
      render: (row) => row.driver?.name || row.driver?.public_id || "—",
    },
    {
      key: "pickup",
      header: "Pickup",
      render: (row) => {
        const { pickup } = resolveRoutePickupDropoff(row);
        return <span className="text-xs text-[#374151]">{pickup}</span>;
      },
    },
    {
      key: "dropoff",
      header: "Drop-off",
      render: (row) => {
        const { dropoff } = resolveRoutePickupDropoff(row);
        return <span className="text-xs text-[#374151]">{dropoff}</span>;
      },
    },
    {
      key: "stops",
      header: "Stops",
      render: (row) => row.details?.stops?.length ?? row.details?.assignments?.length ?? row.stop_count ?? "—",
    },
    {
      key: "distance",
      header: "Distance",
      sortable: true,
      render: (row) => {
        const meters = row.total_distance || row.total_distance_m || row.distance;
        if (meters == null || meters === "") return "—";
        const n = Number(meters);
        return Number.isFinite(n) && n > 1000 ? `${(n / 1000).toFixed(1)} km` : `${meters} m`;
      },
    },
    {
      key: "created",
      header: "Created",
      render: (row) => (row.created_at ? String(row.created_at).slice(0, 10) : "—"),
    },
    {
      key: "actions",
      header: "",
      render: (row) => {
        const rid = routeId(row);
        const orderIds = resolveOrderIdsFromRoute(row);
        return (
          <RouteRowActions
            routeId={rid}
            orderIds={orderIds}
            canPlan={canPlan}
            canDelete={ability.canDeleteOrder}
            onView={() => openDetail(rid)}
            onReplan={() =>
              navigate(`/fleet-ops/operations/routes/new?order_ids=${encodeURIComponent(orderIds.join(","))}`)
            }
            onOptimize={async () => {
              try {
                await fleetopsService.optimizeRoutes({
                  route: row,
                  route_uuid: rid,
                  orders: orderIds,
                });
                toast.success("Optimized");
                load();
              } catch (err) {
                toast.error(parseApiError(err, "Optimize failed"));
              }
            }}
            onDelete={async () => {
              if (!window.confirm("Delete this route?")) return;
              try {
                await fleetopsService.deleteRoute(rid);
                toast.success("Deleted");
                load();
              } catch (err) {
                toast.error(parseApiError(err, "Delete failed"));
              }
            }}
          />
        );
      },
    },
  ];

  return (
    <div data-testid="routes-list-page">
      <PageHeader
        breadcrumbs={[{ label: "FleetOps", to: "/fleet-ops" }, { label: "Routes" }]}
        title="Routes"
        description={`${filtered.length} route plan(s)`}
        actions={
          canPlan ? (
            <Button asChild className="bg-blue-600 hover:bg-blue-700 h-9" data-testid="routes-new-plan">
              <Link to="/fleet-ops/operations/routes/new">
                <Plus className="h-4 w-4 mr-1" /> Plan route
              </Link>
            </Button>
          ) : null
        }
      />
      <div className="p-6 space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <Input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search routes…"
            className="h-9 max-w-xs text-sm"
            data-testid="routes-search"
          />
          <Button type="button" variant="outline" size="sm" className="h-9" onClick={load} disabled={loading}>
            <RefreshCw className={`h-3.5 w-3.5 mr-1 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>

        {!canManageRoutes ? (
          <p className="text-sm text-[#4B5563]">You do not have permission to view routes.</p>
        ) : (
          <DataTable
            columns={columns}
            data={paged}
            loading={loading}
            testid="routes-table"
            pageSize={pageSize}
            onRowClick={(row) => openDetail(routeId(row))}
            serverPagination={{
              page,
              lastPage,
              total: filtered.length,
              onPageChange: setPage,
            }}
          />
        )}
      </div>
    </div>
  );
}

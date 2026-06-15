import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useFleetopsDetailDrawer } from "@/hooks/fleetops/useFleetopsDetailDrawer";
import PageHeader from "@/components/common/PageHeader";
import DataTable from "@/components/common/DataTable";
import { Button } from "@/components/ui/button";
import { Plus, Sparkles, Trash2 } from "lucide-react";
import { fleetopsService } from "@/services/fleetops";
import { resolveOrderIdsFromRoute } from "@/lib/fleetops/routing";
import { useFleetopsAbility } from "@/hooks/fleetops/useFleetopsAbility";
import { toast } from "sonner";

export default function RoutesList() {
  const { openDetail } = useFleetopsDetailDrawer("route");
  const ability = useFleetopsAbility();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const pageSize = 25;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setRows(await fleetopsService.listRoutes({ page, limit: pageSize }));
    } catch (err) {
      toast.error(err?.friendlyMessage || "Failed to load routes");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    load();
  }, [load]);

  const paged = rows.slice((page - 1) * pageSize, page * pageSize);
  const lastPage = Math.max(1, Math.ceil(rows.length / pageSize));

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
      key: "stops",
      header: "Stops",
      render: (row) => row.details?.assignments?.length ?? row.stop_count ?? "—",
    },
    {
      key: "distance",
      header: "Distance",
      sortable: true,
      render: (row) => row.total_distance || row.total_distance_m || row.distance || "—",
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
        return (
          <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
            <Button type="button" size="sm" variant="ghost" className="h-7 text-xs" onClick={() => openDetail(rid)}>
              View
            </Button>
            {(ability.canUpdateOrder || ability.isDispatcher) && (
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="h-7 text-xs"
                data-testid={`route-optimize-${rid}`}
                onClick={async () => {
                  try {
                    await fleetopsService.optimizeRoutes({
                      route: row,
                      route_uuid: rid,
                      orders: resolveOrderIdsFromRoute(row),
                    });
                    toast.success("Optimized");
                    load();
                  } catch (err) {
                    toast.error(err?.friendlyMessage || "Optimize failed");
                  }
                }}
              >
                <Sparkles className="h-3 w-3 mr-1" /> Optimize
              </Button>
            )}
            {ability.canDeleteOrder && (
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="h-7 text-xs text-red-600"
                onClick={async () => {
                  if (!window.confirm("Delete this route?")) return;
                  try {
                    await fleetopsService.deleteRoute(rid);
                    toast.success("Deleted");
                    load();
                  } catch (err) {
                    toast.error(err?.friendlyMessage || "Delete failed");
                  }
                }}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <div data-testid="routes-list-page">
      <PageHeader
        breadcrumbs={[{ label: "FleetOps", to: "/fleet-ops" }, { label: "Routes" }]}
        title="Routes"
        description={`${rows.length} routes`}
        actions={
          ability.canCreateOrder && (
            <Button asChild className="bg-blue-600 hover:bg-blue-700 h-9">
              <Link to="/fleet-ops/operations/routes/new">
                <Plus className="h-4 w-4 mr-1" /> New route
              </Link>
            </Button>
          )
        }
      />
      <div className="p-6">
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
            total: rows.length,
            onPageChange: setPage,
          }}
        />
      </div>
    </div>
  );
}

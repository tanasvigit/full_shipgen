import { useCallback, useEffect, useMemo, useState } from "react";
import PageHeader from "@/components/common/PageHeader";
import DataTable from "@/components/common/DataTable";
import StatusBadge from "@/components/common/StatusBadge";
import OrderConfigEditorDialog from "@/components/fleetops/order-config/OrderConfigEditorDialog";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, Copy, Pencil, Trash2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { fleetopsService } from "@/services/fleetops";
import { mapOrderConfigRow } from "@/lib/fleetops/orderConfig";
import { parseFleetopsApiError } from "@/lib/fleetops/parseApiErrors";
import { useFleetopsAbility } from "@/hooks/fleetops/useFleetopsAbility";
import { fleetopsCache } from "@/domain/fleetops/cache/store";
import { fleetopsCacheKeys } from "@/domain/fleetops/cache/keys";
import FeatureGate from "@/components/platform/FeatureGate";

export default function OrderConfigManager() {
  const ability = useFleetopsAbility();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editorMode, setEditorMode] = useState("create");
  const [activeRow, setActiveRow] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const raw = await fleetopsService.listOrderConfigs();
      setRows((raw || []).map(mapOrderConfigRow).filter((r) => r.id));
    } catch (err) {
      toast.error(parseFleetopsApiError(err));
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const openCreate = () => {
    setActiveRow(null);
    setEditorMode("create");
    setEditorOpen(true);
  };

  const openEdit = (row) => {
    setActiveRow(row);
    setEditorMode("edit");
    setEditorOpen(true);
  };

  const handleDuplicate = async (row) => {
    setBusy(true);
    try {
      await fleetopsService.duplicateOrderConfig(row.id);
      toast.success("Config duplicated");
      await load();
      fleetopsCache.invalidate([fleetopsCacheKeys.lookups()]);
    } catch (err) {
      toast.error(parseFleetopsApiError(err));
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setBusy(true);
    try {
      await fleetopsService.deleteOrderConfig(deleteTarget.id);
      toast.success("Config deleted");
      setDeleteTarget(null);
      await load();
      fleetopsCache.invalidate([fleetopsCacheKeys.lookups()]);
    } catch (err) {
      toast.error(parseFleetopsApiError(err));
    } finally {
      setBusy(false);
    }
  };

  const columns = useMemo(
    () => [
      {
        key: "name",
        header: "Config",
        sortable: true,
        render: (row) => (
          <div>
            <div className="font-medium text-[#0A0E1A]">{row.name}</div>
            <div className="text-[10px] font-mono text-[#6B7280]">{row.key}</div>
          </div>
        ),
      },
      {
        key: "type",
        header: "Type",
        sortable: true,
        render: (row) => <span className="text-xs font-mono uppercase text-[#374151]">{row.type}</span>,
      },
      {
        key: "statuses",
        header: "Statuses",
        render: (row) => (
          <div className="flex flex-wrap gap-1 max-w-[240px]">
            {row.statuses.slice(0, 5).map((s) => (
              <StatusBadge key={s} status={s} label={s} />
            ))}
            {row.statuses.length > 5 && (
              <span className="text-[10px] text-[#6B7280]">+{row.statuses.length - 5}</span>
            )}
          </div>
        ),
      },
      {
        key: "activityCount",
        header: "Activities",
        sortable: true,
        render: (row) => <span className="font-mono text-sm">{row.activityCount}</span>,
      },
      {
        key: "enabled",
        header: "State",
        render: (row) => (
          <StatusBadge status={row.enabled ? "active" : "inactive"} label={row.enabled ? "Enabled" : "Disabled"} />
        ),
      },
      {
        key: "createdAt",
        header: "Created",
        sortable: true,
        render: (row) => (
          <span className="text-xs font-mono text-[#4B5563]">
            {row.createdAt ? new Date(row.createdAt).toLocaleDateString() : "—"}
          </span>
        ),
      },
      {
        key: "actions",
        header: "",
        className: "text-right w-[140px]",
        render: (row) => (
          <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
            {ability.canUpdateOrderConfig && (
              <Button type="button" size="icon" variant="ghost" className="h-8 w-8" onClick={() => openEdit(row)} data-testid={`order-config-edit-${row.id}`}>
                <Pencil className="h-3.5 w-3.5" />
              </Button>
            )}
            {ability.canCloneOrderConfig && (
              <Button type="button" size="icon" variant="ghost" className="h-8 w-8" disabled={busy} onClick={() => handleDuplicate(row)} data-testid={`order-config-duplicate-${row.id}`}>
                <Copy className="h-3.5 w-3.5" />
              </Button>
            )}
            {ability.canDeleteOrderConfig && (
              <Button type="button" size="icon" variant="ghost" className="h-8 w-8 text-[#B91C1C]" disabled={busy} onClick={() => setDeleteTarget(row)} data-testid={`order-config-delete-${row.id}`}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        ),
      },
    ],
    [ability, busy],
  );

  if (!ability.canListOrderConfig) {
    return (
      <div className="p-8 text-sm text-[#4B5563]" data-testid="order-config-forbidden">
        You do not have permission to manage order configurations.
      </div>
    );
  }

  return (
    <FeatureGate feature="orderConfigManager">
    <div data-testid="order-config-manager-page">
      <PageHeader
        breadcrumbs={[
          { label: "FleetOps", to: "/fleet-ops" },
          { label: "Operations" },
          { label: "Order config" },
        ]}
        overline="Operations"
        title="Order configurations"
        description="Manage logistics workflows, statuses, and kanban columns."
        actions={
          <>
            <Button type="button" variant="outline" size="sm" className="h-9" disabled={loading} onClick={() => load()}>
              <RefreshCw className={`h-4 w-4 mr-1 ${loading ? "animate-spin" : ""}`} /> Refresh
            </Button>
            {ability.canCreateOrderConfig && (
              <Button type="button" size="sm" className="h-9 bg-[#0066FF] hover:bg-[#0040CC]" onClick={openCreate} data-testid="order-config-new-button">
                <Plus className="h-4 w-4 mr-1" /> New config
              </Button>
            )}
          </>
        }
      />

      <div className="p-6">
        <DataTable
          testid="order-config-table"
          columns={columns}
          data={rows}
          loading={loading}
          searchKeys={["name", "key", "description", "type"]}
          pageSize={12}
          onRowClick={ability.canUpdateOrderConfig ? openEdit : undefined}
        />
      </div>

      <OrderConfigEditorDialog
        open={editorOpen}
        onOpenChange={setEditorOpen}
        configRow={activeRow}
        mode={editorMode}
        onSaved={() => {
          load();
          fleetopsCache.invalidate([fleetopsCacheKeys.lookups()]);
        }}
      />

      <AlertDialog open={Boolean(deleteTarget)} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent data-testid="order-config-delete-dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete order config?</AlertDialogTitle>
            <AlertDialogDescription>
              Delete <strong>{deleteTarget?.name}</strong>? Existing orders using this config are not removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-[#B91C1C] hover:bg-[#991B1B]">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
    </FeatureGate>
  );
}

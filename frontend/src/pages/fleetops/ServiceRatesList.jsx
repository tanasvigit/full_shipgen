import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import PageHeader from "@/components/common/PageHeader";
import DataTable from "@/components/common/DataTable";
import FleetOpsFormDialog from "@/components/fleetops/FleetOpsFormDialog";
import ServiceRateForm from "@/components/fleetops/forms/ServiceRateForm";
import { useFleetopsFormDialog, useFormRef } from "@/components/fleetops/useFleetopsFormDialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, Plus, RefreshCw, Trash2 } from "lucide-react";
import { fleetopsService } from "@/services/fleetops";
import { CRUD_ENTITIES } from "@/lib/fleetops/crudEntities";
import { getCrudApi } from "@/lib/fleetops/crudApi";
import {
  serviceRateDisplayName,
  serviceRatePerDistanceLabel,
  serviceRateRowId,
} from "@/lib/fleetops/serviceRatePayloads";
import { formatMoney } from "@/lib/formatMoney";
import { toast } from "sonner";
import { useFleetopsPermission } from "@/hooks/fleetops/useFleetopsPermission";
import { useFleetopsDetailDrawer } from "@/hooks/fleetops/useFleetopsDetailDrawer";
import { parseApiError } from "@/lib/errors";

const config = CRUD_ENTITIES.serviceRate;

export default function ServiceRatesList() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { openDetail } = useFleetopsDetailDrawer("serviceRate");
  const formRef = useFormRef();
  const api = useMemo(() => getCrudApi("serviceRate"), []);
  const { can } = useFleetopsPermission();
  const canCreate = can("create", "service-rate");
  const canDelete = can("delete", "service-rate");
  const canExport = can("export", "service-rate") || can("view", "service-rate");
  const canView = can("view", "service-rate");

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState("all");
  const [selectedKeys, setSelectedKeys] = useState([]);

  const load = useCallback(async () => {
    if (!canView) {
      setRows([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      setRows(await api.list());
    } catch (err) {
      toast.error(parseApiError(err, "Failed to load service rates"));
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [api, canView]);

  useEffect(() => {
    load();
  }, [load]);

  const dialog = useFleetopsFormDialog({
    formRef,
    successMessage: "Service rate created",
    onSubmit: async (values) => {
      const row = await api.create(values);
      await load();
      const id = serviceRateRowId(row);
      if (id) openDetail(id);
      return row;
    },
  });

  useEffect(() => {
    if (searchParams.get("create") === "1" && canCreate) {
      dialog.setOpen(true);
      const next = new URLSearchParams(searchParams);
      next.delete("create");
      setSearchParams(next, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams.get("create"), canCreate]);

  const types = [...new Set(rows.map((r) => r.service_type || r.serviceType).filter(Boolean))];
  const filtered =
    typeFilter === "all" ? rows : rows.filter((r) => (r.service_type || r.serviceType) === typeFilter);
  const tableRows = filtered.map((row) => ({ ...row, id: serviceRateRowId(row) }));

  const handleExport = async () => {
    try {
      const params = selectedKeys.length > 0 ? { selections: selectedKeys } : undefined;
      const blob = await fleetopsService.exportServiceRates(params);
      fleetopsService.downloadExportBlob(blob, "service-rates.csv");
      toast.success("Export downloaded");
    } catch (err) {
      toast.error(parseApiError(err, "Export failed"));
    }
  };

  const handleBulkDelete = async () => {
    if (!selectedKeys.length) return;
    if (!window.confirm(`Delete ${selectedKeys.length} service rate(s)?`)) return;
    try {
      await fleetopsService.bulkDeleteServiceRates(selectedKeys);
      toast.success("Deleted");
      setSelectedKeys([]);
      load();
    } catch (err) {
      toast.error(parseApiError(err, "Bulk delete failed"));
    }
  };

  const handleDeleteRow = async (row) => {
    const rid = serviceRateRowId(row);
    if (!window.confirm(`Delete ${serviceRateDisplayName(row)}?`)) return;
    try {
      await api.remove(rid);
      toast.success("Deleted");
      setSelectedKeys((prev) => prev.filter((k) => k !== rid));
      load();
    } catch (err) {
      toast.error(parseApiError(err, "Delete failed"));
    }
  };

  const openRow = useCallback(
    (row) => {
      const rid = serviceRateRowId(row);
      if (rid) openDetail(rid);
    },
    [openDetail],
  );

  const columns = [
    {
      key: "public_id",
      header: "ID",
      render: (row) => (
        <span className="font-mono text-xs text-[#374151]">{row.public_id || "—"}</span>
      ),
    },
    {
      key: "service_name",
      header: "Name",
      sortable: true,
      render: (row) => (
        <button
          type="button"
          className="text-[#0066FF] hover:underline text-left font-medium"
          onClick={(e) => {
            e.stopPropagation();
            openRow(row);
          }}
        >
          {serviceRateDisplayName(row)}
        </button>
      ),
    },
    { key: "service_type", header: "Type", sortable: true, render: (row) => row.service_type || row.serviceType || "—" },
    {
      key: "rate_calculation_method",
      header: "Method",
      render: (row) => row.rate_calculation_method || row.rateCalculationMethod || "—",
    },
    {
      key: "base_fee",
      header: "Base fee",
      sortable: true,
      render: (row) => formatMoney(row.base_fee ?? row.baseFee, row.currency || "INR"),
    },
    {
      key: "per_distance",
      header: "Per distance",
      render: (row) => serviceRatePerDistanceLabel(row),
    },
    {
      key: "currency",
      header: "Currency",
      render: (row) => row.currency || "—",
    },
    {
      key: "actions",
      header: "",
      render: (row) =>
        canDelete ? (
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="h-7 text-xs text-red-600"
            data-testid={`service-rate-delete-${serviceRateRowId(row)}`}
            onClick={(e) => {
              e.stopPropagation();
              void handleDeleteRow(row);
            }}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        ) : null,
    },
  ];

  if (!canView) {
    return (
      <div className="p-8 text-[#374151]" data-testid="service-rate-forbidden">
        You do not have permission to view service rates.
      </div>
    );
  }

  return (
    <div data-testid="service-rates-list-page">
      <PageHeader
        breadcrumbs={[{ label: "FleetOps", to: "/fleet-ops" }, { label: "Service rates" }]}
        title="Service rates"
        description={`${tableRows.length} rate${tableRows.length === 1 ? "" : "s"}`}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={load} disabled={loading} data-testid="service-rates-refresh">
              <RefreshCw className={`h-4 w-4 mr-1 ${loading ? "animate-spin" : ""}`} /> Refresh
            </Button>
            {canExport && (
              <Button variant="outline" onClick={handleExport} data-testid="service-rates-export">
                <Download className="h-4 w-4 mr-1" /> Export
              </Button>
            )}
            {canDelete && selectedKeys.length > 0 && (
              <Button variant="destructive" onClick={handleBulkDelete} data-testid="service-rates-bulk-delete">
                <Trash2 className="h-4 w-4 mr-1" /> Delete ({selectedKeys.length})
              </Button>
            )}
            {canCreate && (
              <Button
                onClick={() => dialog.setOpen(true)}
                className="bg-blue-600 h-9"
                data-testid="service-rates-new-button"
              >
                <Plus className="h-4 w-4 mr-1" /> New rate
              </Button>
            )}
          </div>
        }
      />
      <div className="p-6">
        <div className="mb-4 flex items-center gap-2">
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[180px]" data-testid="service-rates-type-filter">
              <SelectValue placeholder="Service type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              {types.map((t) => (
                <SelectItem key={t} value={t}>
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <DataTable
          columns={columns}
          data={tableRows}
          loading={loading}
          testid="service-rates-table"
          searchKeys={["service_name", "name", "service_type", "public_id"]}
          rowKey="id"
          selectable={canDelete}
          selectedKeys={selectedKeys}
          onSelectedKeysChange={setSelectedKeys}
          onRowClick={(row) => openRow(row)}
        />
      </div>

      <FleetOpsFormDialog
        open={dialog.open}
        onOpenChange={dialog.setOpen}
        title="New service rate"
        submitLabel="Create service rate"
        busy={dialog.busy}
        error={dialog.error}
        onSubmit={dialog.handleSubmit}
        testId="service-rate-create-dialog"
        size={config.formDialogSize || "lg"}
      >
        {dialog.open && <ServiceRateForm ref={formRef} formId="service-rate-create" />}
      </FleetOpsFormDialog>
    </div>
  );
}

import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import PageHeader from "@/components/common/PageHeader";
import DataTable from "@/components/common/DataTable";
import StatusBadge from "@/components/common/StatusBadge";
import FleetOpsFormDialog from "@/components/fleetops/FleetOpsFormDialog";
import SimpleEntityForm from "@/components/fleetops/crud/SimpleEntityForm";
import { useFleetopsFormDialog, useFormRef } from "@/components/fleetops/useFleetopsFormDialog";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { mapCrudRow } from "@/lib/fleetops/crudEntities";
import { getCrudApi } from "@/lib/fleetops/crudApi";
import { useFleetopsPermission } from "@/hooks/fleetops/useFleetopsPermission";

export default function FleetopsCrudListPage({ config }) {
  const navigate = useNavigate();
  const formRef = useFormRef();
  const api = useMemo(() => getCrudApi(config.key), [config.key]);
  const { can } = useFleetopsPermission();
  const resource = config.permissionResource || config.key;
  const canView = can("view", resource);
  const canCreate = can("create", resource);
  const canDelete = can("delete", resource);

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  const testPrefix = config.key.replace(/([A-Z])/g, "-$1").toLowerCase();

  const load = useCallback(async () => {
    if (!canView) {
      setRows([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const raw = await api.list();
      setRows(raw.map((r) => mapCrudRow(r, config.key)));
    } catch (err) {
      toast.error(err?.friendlyMessage || `Could not load ${config.pluralLabel.toLowerCase()}.`);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [api, canView, config.key, config.pluralLabel]);

  useEffect(() => {
    load();
  }, [load]);

  const dialog = useFleetopsFormDialog({
    formRef,
    successMessage: `${config.singularLabel} created`,
    onSubmit: async (values) => {
      await api.create(values);
      await load();
    },
  });

  const handleDelete = async (row) => {
    if (!canDelete) {
      toast.error("You do not have permission to delete this record.");
      return;
    }
    if (!window.confirm(`Delete ${row.name}?`)) return;
    try {
      await api.remove(row.id);
      toast.success("Deleted");
      await load();
    } catch (err) {
      toast.error(err?.friendlyMessage || "Delete failed");
    }
  };

  const columns = useMemo(
    () => [
      {
        key: "name",
        header: "Name",
        sortable: true,
        render: (r) => (
          <Link className="text-[#0066FF] font-medium" to={`${config.listPath}/${r.id}`}>
            {r.name}
          </Link>
        ),
      },
      {
        key: "status",
        header: "Status",
        render: (r) => <StatusBadge status={r.status} label={String(r.status || "—")} />,
      },
      { key: "publicId", header: "Public ID", render: (r) => <span className="font-mono text-xs">{r.publicId}</span> },
      ...(config.fields.some((f) => f.name === "email")
        ? [{ key: "email", header: "Email", render: (r) => r.email || "—" }]
        : []),
      {
        key: "actions",
        header: "",
        render: (r) =>
          canDelete ? (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={(e) => {
                e.stopPropagation();
                void handleDelete(r);
              }}
              data-testid={`${testPrefix}-delete-${r.id}`}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          ) : null,
      },
    ],
    [config, canDelete, testPrefix],
  );

  if (!canView) {
    return (
      <div className="p-8 text-[#374151]" data-testid={`${testPrefix}-forbidden`}>
        You do not have permission to view {config.pluralLabel.toLowerCase()}.
      </div>
    );
  }

  return (
    <div data-testid={`${testPrefix}-list-page`}>
      <PageHeader
        breadcrumbs={[
          { label: "FleetOps", to: "/fleet-ops" },
          { label: config.section },
          { label: config.pluralLabel },
        ]}
        overline={config.section}
        title={config.pluralLabel}
        description={loading ? "Loading…" : `${rows.length} records`}
        actions={
          canCreate && !config.readOnly ? (
            <Button
              onClick={() => dialog.setOpen(true)}
              className="bg-[#0066FF] hover:bg-[#0040CC] text-white h-10"
              data-testid={`${testPrefix}-new-button`}
            >
              <Plus className="h-4 w-4 mr-1.5" /> New {config.singularLabel.toLowerCase()}
            </Button>
          ) : null
        }
      />
      <div className="p-6">
        {!loading && rows.length === 0 && (
          <div className="mb-4 text-sm text-[#4B5563]" data-testid={`${testPrefix}-empty`}>
            No {config.pluralLabel.toLowerCase()} yet.
          </div>
        )}
        <DataTable
          testid={`${testPrefix}-table`}
          columns={columns}
          data={rows}
          loading={loading}
          searchKeys={config.searchKeys}
          pageSize={10}
          onRowClick={(r) => navigate(`${config.listPath}/${r.id}`)}
        />
      </div>

      {!config.readOnly && (
        <FleetOpsFormDialog
          open={dialog.open}
          onOpenChange={dialog.setOpen}
          title={`New ${config.singularLabel.toLowerCase()}`}
          submitLabel={`Create ${config.singularLabel.toLowerCase()}`}
          busy={dialog.busy}
          error={dialog.error}
          onSubmit={dialog.handleSubmit}
          testId={`${testPrefix}-create-dialog`}
        >
          <SimpleEntityForm ref={formRef} formId={`${testPrefix}-create`} fields={config.fields} />
        </FleetOpsFormDialog>
      )}
    </div>
  );
}

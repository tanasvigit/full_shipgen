import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import PageHeader from "@/components/common/PageHeader";
import StatusBadge from "@/components/common/StatusBadge";
import DetailFieldGrid from "@/components/fleetops/detail/DetailFieldGrid";
import FleetOpsFormDialog from "@/components/fleetops/FleetOpsFormDialog";
import SimpleEntityForm, { valuesFromApi } from "@/components/fleetops/crud/SimpleEntityForm";
import { useFleetopsFormDialog, useFormRef } from "@/components/fleetops/useFleetopsFormDialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Edit3, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { mapCrudRow } from "@/lib/fleetops/crudEntities";
import { getCrudApi } from "@/lib/fleetops/crudApi";
import { useFleetopsPermission } from "@/hooks/fleetops/useFleetopsPermission";
import { fleetopsService } from "@/services/fleetops";

const ISSUE_STATUSES = ["open", "in_progress", "resolved", "closed"];
const WO_STATUSES = ["draft", "scheduled", "in_progress", "completed", "cancelled"];

export default function FleetopsCrudDetailPage({ config, relationSlots = null }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const formRef = useFormRef();
  const api = useMemo(() => getCrudApi(config.key), [config.key]);
  const { can } = useFleetopsPermission();
  const resource = config.permissionResource || config.key;
  const canView = can("view", resource);
  const canUpdate = can("update", resource);
  const canDelete = can("delete", resource);

  const [loading, setLoading] = useState(true);
  const [raw, setRaw] = useState(null);
  const [row, setRow] = useState(null);

  const testPrefix = config.key.replace(/([A-Z])/g, "-$1").toLowerCase();

  const load = useCallback(async () => {
    if (!id || !canView) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const entity = await api.get(id);
      setRaw(entity);
      setRow(mapCrudRow(entity, config.key));
    } catch (err) {
      toast.error(err?.friendlyMessage || "Could not load record.");
      setRaw(null);
      setRow(null);
    } finally {
      setLoading(false);
    }
  }, [api, canView, config.key, id]);

  useEffect(() => {
    load();
  }, [load]);

  const editDialog = useFleetopsFormDialog({
    formRef,
    successMessage: "Saved",
    onSubmit: async (values) => {
      await api.update(id, values);
      await load();
    },
  });

  const handleDelete = async () => {
    if (!canDelete) {
      toast.error("You do not have permission to delete this record.");
      return;
    }
    if (!window.confirm("Delete this record?")) return;
    try {
      await api.remove(id);
      toast.success("Deleted");
      navigate(config.listPath);
    } catch (err) {
      toast.error(err?.friendlyMessage || "Delete failed");
    }
  };

  const handleStatusChange = async (status) => {
    if (!canUpdate) return;
    try {
      if (config.key === "issue") await fleetopsService.updateIssueStatus(id, status);
      else if (config.key === "workOrder") await fleetopsService.updateWorkOrderStatus(id, status);
      else await api.update(id, { status });
      toast.success("Status updated");
      await load();
    } catch (err) {
      toast.error(err?.friendlyMessage || "Status update failed");
    }
  };

  if (!canView) {
    return (
      <div className="p-8 text-[#374151]" data-testid={`${testPrefix}-detail-forbidden`}>
        You do not have permission to view this {config.singularLabel.toLowerCase()}.
      </div>
    );
  }

  if (!loading && !row) {
    return (
      <div className="p-8" data-testid={`${testPrefix}-detail-not-found`}>
        {config.singularLabel} not found.{" "}
        <Link to={config.listPath} className="text-[#0066FF]">
          Back to list
        </Link>
      </div>
    );
  }

  const statusOptions = config.key === "issue" ? ISSUE_STATUSES : config.key === "workOrder" ? WO_STATUSES : [];

  return (
    <div data-testid={`${testPrefix}-detail-page`}>
      <PageHeader
        breadcrumbs={[
          { label: "FleetOps", to: "/fleet-ops" },
          { label: config.section },
          { label: config.pluralLabel, to: config.listPath },
          { label: row?.name || "…" },
        ]}
        overline={config.singularLabel}
        title={loading ? "Loading…" : row?.name}
        description={row?.publicId}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate(config.listPath)} data-testid={`${testPrefix}-back`}>
              <ArrowLeft className="h-4 w-4 mr-1" /> Back
            </Button>
            {canUpdate && !config.readOnly && (
              <Button onClick={() => editDialog.setOpen(true)} data-testid={`${testPrefix}-edit`}>
                <Edit3 className="h-4 w-4 mr-1" /> Edit
              </Button>
            )}
            {canDelete && !config.readOnly && (
              <Button variant="destructive" onClick={handleDelete} data-testid={`${testPrefix}-delete`}>
                <Trash2 className="h-4 w-4 mr-1" /> Delete
              </Button>
            )}
          </div>
        }
      />
      <div className="p-6 grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
        <div className="bg-white border border-black/[0.08] rounded-md p-5 space-y-4">
          {loading ? (
            <p className="text-sm text-[#4B5563]">Loading…</p>
          ) : (
            <>
              <div className="flex items-center gap-3">
                <StatusBadge status={row.status} label={String(row.status || "—")} />
                {config.statusField && canUpdate && (
                  <Select value={String(row.status || "")} onValueChange={handleStatusChange}>
                    <SelectTrigger className="w-[180px]" data-testid={`${testPrefix}-status-select`}>
                      <SelectValue placeholder="Update status" />
                    </SelectTrigger>
                    <SelectContent>
                      {statusOptions.map((s) => (
                        <SelectItem key={s} value={s}>
                          {s.replace(/_/g, " ")}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
              <DetailFieldGrid
                fields={config.fields.map((f) => ({
                  label: f.label,
                  value: row.raw?.[f.name] ?? row.raw?.[f.name.replace(/_([a-z])/g, (_, c) => c.toUpperCase())] ?? "—",
                }))}
              />
              {relationSlots}
            </>
          )}
        </div>
        <aside className="bg-white border border-black/[0.08] rounded-md p-4 text-sm text-[#374151] space-y-2">
          <div className="overline">Relations</div>
          {relationSlots ? (
            <p className="text-xs">Linked records appear in the main panel.</p>
          ) : (
            <p className="text-xs text-[#4B5563]">No linked records for this entity.</p>
          )}
        </aside>
      </div>

      <FleetOpsFormDialog
        open={editDialog.open}
        onOpenChange={editDialog.setOpen}
        title={`Edit ${config.singularLabel.toLowerCase()}`}
        submitLabel="Save changes"
        busy={editDialog.busy}
        error={editDialog.error}
        onSubmit={editDialog.handleSubmit}
        testId={`${testPrefix}-edit-dialog`}
      >
        {editDialog.open && (
          <SimpleEntityForm
            ref={formRef}
            formId={`${testPrefix}-edit`}
            mode="edit"
            fields={config.fields}
            initialValues={valuesFromApi(raw, config.fields)}
          />
        )}
      </FleetOpsFormDialog>
    </div>
  );
}

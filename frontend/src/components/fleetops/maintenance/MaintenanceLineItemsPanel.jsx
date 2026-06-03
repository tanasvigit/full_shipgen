import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import DataTable from "@/components/common/DataTable";
import { fleetopsService } from "@/services/fleetops";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import { useFleetopsPermission } from "@/hooks/fleetops/useFleetopsPermission";

export default function MaintenanceLineItemsPanel({ maintenanceId, maintenanceApi }) {
  const [items, setItems] = useState([]);
  const [draft, setDraft] = useState({ description: "", quantity: "1", cost: "" });
  const [busy, setBusy] = useState(false);
  const { can } = useFleetopsPermission();
  const canEdit = can("update", "maintenance");

  const syncFromApi = useCallback(() => {
    const raw = maintenanceApi?.line_items || maintenanceApi?.lineItems || [];
    setItems(Array.isArray(raw) ? raw.map((it, i) => ({ ...it, _index: i })) : []);
  }, [maintenanceApi]);

  useEffect(() => {
    syncFromApi();
  }, [syncFromApi]);

  const reload = async () => {
    const row = await fleetopsService.getMaintenance(maintenanceId);
    const raw = row?.line_items || row?.lineItems || [];
    setItems(Array.isArray(raw) ? raw.map((it, i) => ({ ...it, _index: i })) : []);
  };

  const add = async () => {
    if (!draft.description.trim()) return;
    setBusy(true);
    try {
      await fleetopsService.addMaintenanceLineItem(maintenanceId, {
        description: draft.description,
        quantity: Number(draft.quantity) || 1,
        cost: draft.cost ? Number(draft.cost) : undefined,
      });
      toast.success("Line item added");
      setDraft({ description: "", quantity: "1", cost: "" });
      await reload();
    } catch (err) {
      toast.error(err?.friendlyMessage || "Add failed");
    } finally {
      setBusy(false);
    }
  };

  const remove = async (index) => {
    setBusy(true);
    try {
      await fleetopsService.removeMaintenanceLineItem(maintenanceId, index);
      toast.success("Removed");
      await reload();
    } catch (err) {
      toast.error(err?.friendlyMessage || "Remove failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mt-4 space-y-3" data-testid="maintenance-line-items-panel">
      <div className="overline">Line items</div>
      {canEdit && (
        <div className="flex flex-wrap gap-2 items-end">
          <Input
            placeholder="Description"
            value={draft.description}
            onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))}
            className="max-w-xs"
            data-testid="maintenance-line-item-desc"
          />
          <Input
            placeholder="Qty"
            value={draft.quantity}
            onChange={(e) => setDraft((d) => ({ ...d, quantity: e.target.value }))}
            className="w-20"
          />
          <Input
            placeholder="Cost"
            value={draft.cost}
            onChange={(e) => setDraft((d) => ({ ...d, cost: e.target.value }))}
            className="w-24"
          />
          <Button size="sm" disabled={busy} onClick={add} data-testid="maintenance-line-item-add">
            <Plus className="h-3.5 w-3.5 mr-1" /> Add
          </Button>
        </div>
      )}
      <DataTable
        testid="maintenance-line-items-table"
        columns={[
          { key: "description", header: "Description", render: (r) => r.description || r.name || "—" },
          { key: "quantity", header: "Qty", render: (r) => r.quantity ?? "—" },
          { key: "cost", header: "Cost", render: (r) => r.cost ?? "—" },
          {
            key: "actions",
            header: "",
            render: (r) =>
              canEdit ? (
                <Button variant="ghost" size="sm" onClick={() => remove(r._index)} data-testid={`maintenance-line-remove-${r._index}`}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              ) : null,
          },
        ]}
        data={items}
        pageSize={10}
        emptyMessage="No line items"
      />
    </div>
  );
}

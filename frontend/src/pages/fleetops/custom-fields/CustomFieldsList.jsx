import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import FleetopsCrudListPage from "@/components/fleetops/crud/FleetopsCrudListPage";
import { CRUD_ENTITIES } from "@/lib/fleetops/crudEntities";
import { fleetopsService } from "@/services/fleetops";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import FleetOpsFormDialog from "@/components/fleetops/FleetOpsFormDialog";
import DataTable from "@/components/common/DataTable";
import { Plus } from "lucide-react";

function CustomFieldGroupsPanel() {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialog, setDialog] = useState(false);
  const [name, setName] = useState("");
  const [entityType, setEntityType] = useState("order");
  const [busy, setBusy] = useState(false);

  const loadGroups = useCallback(async () => {
    setLoading(true);
    try {
      const rows = await fleetopsService.listCustomFieldGroups();
      setGroups(rows || []);
    } catch (err) {
      toast.error(err?.friendlyMessage || "Failed to load groups");
      setGroups([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadGroups();
  }, [loadGroups]);

  const createGroup = async () => {
    if (!name.trim()) {
      toast.error("Group name is required");
      return;
    }
    setBusy(true);
    try {
      await fleetopsService.createCustomFieldGroup({ name: name.trim(), entity_type: entityType, entityType });
      toast.success("Group created");
      setDialog(false);
      setName("");
      await loadGroups();
    } catch (err) {
      toast.error(err?.friendlyMessage || "Could not create group");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <section
        className="mx-6 mt-4 rounded-md border border-black/[0.08] bg-white p-4 space-y-3"
        data-testid="custom-field-groups-panel"
      >
        <div className="flex items-center justify-between">
          <div className="overline">Field groups (G031)</div>
          <Button size="sm" onClick={() => setDialog(true)} data-testid="custom-field-group-add">
            <Plus className="h-4 w-4 mr-1" /> New group
          </Button>
        </div>
        <DataTable
          testid="custom-field-groups-table"
          loading={loading}
          data={groups}
          pageSize={8}
          searchKeys={["name", "entity_type", "entityType"]}
          columns={[
            { key: "name", header: "Group", render: (r) => r.name || "—" },
            {
              key: "entity",
              header: "Entity",
              render: (r) => r.entity_type || r.entityType || "—",
            },
            { key: "id", header: "ID", render: (r) => r.uuid || r.id || "—" },
          ]}
          emptyMessage="No custom field groups yet"
        />
      </section>

      <FleetOpsFormDialog
        open={dialog}
        onOpenChange={setDialog}
        title="New custom field group"
        submitLabel="Create group"
        busy={busy}
        onSubmit={createGroup}
        testId="custom-field-group-dialog"
      >
        <div className="space-y-3">
          <div>
            <Label>Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} data-testid="custom-field-group-name" />
          </div>
          <div>
            <Label>Entity type</Label>
            <Input
              value={entityType}
              onChange={(e) => setEntityType(e.target.value)}
              placeholder="order, driver, vehicle, place…"
              data-testid="custom-field-group-entity"
            />
          </div>
        </div>
      </FleetOpsFormDialog>
    </>
  );
}

export default function CustomFieldsList() {
  return (
    <div data-testid="custom-fields-admin-page">
      <CustomFieldGroupsPanel />
      <FleetopsCrudListPage config={CRUD_ENTITIES.customField} />
    </div>
  );
}

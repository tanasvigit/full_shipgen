import { useCallback, useEffect, useState } from "react";
import PageHeader from "@/components/common/PageHeader";
import QuickCreateDialog from "@/components/common/QuickCreateDialog";
import { Button } from "@/components/ui/button";
import { Plus, UsersRound } from "lucide-react";
import { toast } from "sonner";
import { iamService } from "@/services/iam";
import { mapGroup, mapRole } from "@/lib/mappers";

export default function GroupsList() {
  const [groups, setGroups] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [g, r] = await Promise.all([iamService.listGroups(), iamService.listRoles()]);
      setGroups((g || []).map(mapGroup));
      setRoles((r || []).map(mapRole));
    } catch (err) {
      toast.error(err?.friendlyMessage || "Could not load groups.");
      setGroups([]);
      setRoles([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  async function handleCreate(v) {
    const role = roles.find((x) => String(x.id) === String(v.defaultRole));
    try {
      await iamService.createGroup({
        name: v.name,
        description: v.description || undefined,
        role_uuid: role?.id,
        role: role?.name,
      });
      await loadAll();
      return { toast: `Group "${v.name}" created` };
    } catch (err) {
      throw new Error(err?.friendlyMessage || "Could not create group.");
    }
  }

  return (
    <div data-testid="groups-list-page">
      <PageHeader
        breadcrumbs={[{ label: "IAM", to: "/iam" }, { label: "Groups" }]}
        overline="Identity & Access"
        title="Groups"
        description={loading ? "Loading groups…" : `${groups.length} groups for batch role assignment`}
        actions={
          <Button
            onClick={() => setOpen(true)}
            className="bg-[#0066FF] hover:bg-[#0040CC] text-white h-10 rounded-lg shadow-[0_10px_28px_-8px_rgba(0,102,255,0.45)]"
            data-testid="groups-new-button"
          >
            <Plus className="h-4 w-4 mr-1.5" /> Create group
          </Button>
        }
      />
      <div className="p-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {!loading && groups.length === 0 && (
          <div className="col-span-full text-sm text-[#4B5563]" data-testid="groups-empty">
            No groups returned from the API.
          </div>
        )}
        {groups.map((g) => (
          <div
            key={g.id}
            className="bg-white border border-black/[0.08] rounded-md p-5 hover:border-black/[0.14] transition-colors"
            data-testid={`group-card-${g.id}`}
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="h-9 w-9 bg-[#0066FF]/10 border border-[#0066FF]/25 grid place-items-center rounded-md">
                <UsersRound className="h-4 w-4 text-[#0066FF]" />
              </div>
              <div>
                <div className="font-display font-bold tracking-tight text-[#0A0E1A]">{g.name}</div>
                <div className="overline">{g.members} members</div>
              </div>
            </div>
            <p className="text-sm text-[#374151]">{g.description || "—"}</p>
            <div className="mt-4 pt-4 border-t border-black/[0.08] flex flex-wrap gap-1.5">
              {(g.roles || []).map((r) => (
                <span key={r} className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 bg-[#F1F2F5] border border-black/[0.08] rounded-sm">
                  {r}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
      <QuickCreateDialog
        open={open}
        onOpenChange={setOpen}
        title="Create group"
        description="Creates a group via the IAM API. Payload keys may need to match your Fleetbase installation."
        icon={UsersRound}
        submitLabel="Create group"
        testid="create-group-dialog"
        fields={[
          { key: "name", label: "Group name", placeholder: "Dispatch team · NYC", required: true },
          {
            key: "defaultRole",
            label: "Default role",
            type: "select",
            required: true,
            options: roles.map((r) => ({ value: String(r.id), label: r.name })),
          },
          { key: "description", label: "Description", type: "textarea", placeholder: "What this group does." },
        ]}
        onSubmit={handleCreate}
      />
    </div>
  );
}

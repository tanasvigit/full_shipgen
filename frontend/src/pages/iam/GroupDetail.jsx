import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import PageHeader from "@/components/common/PageHeader";
import AddGroupMembersDialog from "@/components/iam/groups/AddGroupMembersDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Plus, Trash2, UserMinus } from "lucide-react";
import { toast } from "sonner";
import { iamService } from "@/services/iam";
import { mapGroup, mapRole } from "@/lib/mappers";
import { useIamAbility } from "@/hooks/iam/useIamAbility";

export default function GroupDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const ability = useIamAbility();
  const [group, setGroup] = useState(null);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [defaultRoleId, setDefaultRoleId] = useState("");
  const [addOpen, setAddOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const raw = await iamService.getGroup(id);
      const mapped = mapGroup(raw);
      setGroup(mapped);
      setName(mapped.name);
      setDescription(mapped.description || "");
      setDefaultRoleId(mapped.defaultRoleId ? String(mapped.defaultRoleId) : "");
    } catch (err) {
      setGroup(null);
      if (err?.response?.status === 404) toast.error("Group not found.");
      else toast.error(err?.friendlyMessage || "Could not load group.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    iamService
      .listRoles({ limit: 100 })
      .then((rows) => setRoles(rows.map(mapRole)))
      .catch(() => setRoles([]));
  }, []);

  if (loading) {
    return <div className="p-8 text-[#374151]">Loading group…</div>;
  }
  if (!group) {
    return <div className="p-8 text-[#374151]">Group not found.</div>;
  }

  const memberIds = (group.members || []).map((m) => String(m.id));

  return (
    <div data-testid="group-detail-page">
      <PageHeader
        breadcrumbs={[
          { label: "IAM", to: "/iam" },
          { label: "Groups", to: "/iam/groups" },
          { label: group.name },
        ]}
        overline="Group"
        title={group.name}
        description={`${group.memberCount} member(s)${group.defaultRoleName ? ` · default role ${group.defaultRoleName}` : ""}`}
        actions={
          <Button variant="outline" onClick={() => navigate("/iam/groups")} className="border-black/[0.08]">
            <ArrowLeft className="h-4 w-4 mr-1" /> Back
          </Button>
        }
      />

      <div className="p-6 max-w-4xl space-y-4">
        <div className="bg-white border border-black/[0.08] rounded-md p-5 space-y-4">
          <div className="overline">Details</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs uppercase tracking-wider font-mono text-[#374151]">Name</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={!ability.canUpdateGroup}
                data-testid="group-name"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs uppercase tracking-wider font-mono text-[#374151]">Default role</Label>
              <Select value={defaultRoleId} onValueChange={setDefaultRoleId} disabled={!ability.canUpdateGroup}>
                <SelectTrigger data-testid="group-default-role">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((r) => (
                    <SelectItem key={r.id} value={String(r.id)}>
                      {r.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <Label className="text-xs uppercase tracking-wider font-mono text-[#374151]">Description</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={!ability.canUpdateGroup}
                rows={3}
                data-testid="group-description"
              />
            </div>
          </div>
          {ability.canUpdateGroup && (
            <div className="flex justify-end">
              <Button
                onClick={async () => {
                  try {
                    await iamService.updateGroup(group.id, {
                      name,
                      description: description || undefined,
                      users: memberIds,
                      role: defaultRoleId || undefined,
                      role_uuid: defaultRoleId || undefined,
                    });
                    await load();
                    toast.success("Group saved");
                  } catch (err) {
                    toast.error(err?.friendlyMessage || "Could not save group.");
                  }
                }}
                data-testid="group-save"
              >
                Save details
              </Button>
            </div>
          )}
        </div>

        <div className="bg-white border border-black/[0.08] rounded-md overflow-hidden">
          <div className="px-4 py-3 border-b border-black/[0.08] flex items-center justify-between gap-3">
            <div className="overline">Members</div>
            {ability.canUpdateGroup && (
              <Button size="sm" onClick={() => setAddOpen(true)} data-testid="group-add-members">
                <Plus className="h-3.5 w-3.5 mr-1" /> Add members
              </Button>
            )}
          </div>
          <table className="w-full text-sm" data-testid="group-members-table">
            <thead className="bg-[#F5F6F8]/50">
              <tr>
                <th className="text-left px-4 py-2 text-[10px] uppercase tracking-wider font-mono text-[#4B5563]">Name</th>
                <th className="text-left px-4 py-2 text-[10px] uppercase tracking-wider font-mono text-[#4B5563]">Email</th>
                <th className="w-24" />
              </tr>
            </thead>
            <tbody>
              {(group.members || []).length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-4 py-8 text-center text-[#4B5563]" data-testid="group-members-empty">
                    No members in this group.
                  </td>
                </tr>
              ) : (
                group.members.map((m) => (
                  <tr key={m.id} className="border-t border-black/[0.06]" data-testid={`group-member-${m.id}`}>
                    <td className="px-4 py-3 font-medium">{m.name}</td>
                    <td className="px-4 py-3 text-[#4B5563] font-mono text-xs">{m.email}</td>
                    <td className="px-4 py-3 text-right">
                      {ability.canUpdateGroup && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-600 h-8"
                          onClick={async () => {
                            if (!window.confirm(`Remove ${m.name} from this group?`)) return;
                            try {
                              await iamService.removeGroupMember(group.id, m.id);
                              await load();
                              toast.success("Member removed");
                            } catch (err) {
                              toast.error(err?.friendlyMessage || "Could not remove member.");
                            }
                          }}
                          data-testid={`group-remove-member-${m.id}`}
                        >
                          <UserMinus className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {ability.canDeleteGroup && group.isDeletable && (
          <div className="flex justify-start">
            <Button
              variant="outline"
              className="text-red-600 border-red-200"
              onClick={async () => {
                if (!window.confirm(`Delete group "${group.name}"?`)) return;
                try {
                  await iamService.deleteGroup(group.id);
                  toast.success("Group deleted");
                  navigate("/iam/groups");
                } catch (err) {
                  toast.error(err?.friendlyMessage || "Could not delete group.");
                }
              }}
              data-testid="group-delete"
            >
              <Trash2 className="h-4 w-4 mr-1" /> Delete group
            </Button>
          </div>
        )}
      </div>

      <AddGroupMembersDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        groupId={group.id}
        existingMemberIds={memberIds}
        onAdded={load}
      />
    </div>
  );
}

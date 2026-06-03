import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import PolicyAttacher from "@/components/iam/roles/PolicyAttacher";
import { iamService } from "@/services/iam";
import { mapRole } from "@/lib/mappers";
import { isReservedRoleName } from "@/lib/iam/permissions";
import { toast } from "sonner";

function resolvePolicyIds(policies = []) {
  return policies.map((p) => String(p.id || p.uuid)).filter(Boolean);
}

export default function RoleFormDialog({
  open,
  onOpenChange,
  mode = "create",
  roleId = null,
  permissionIds = [],
  onSaved,
  readOnly = false,
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [policies, setPolicies] = useState([]);
  const [policyCatalog, setPolicyCatalog] = useState([]);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    iamService.listPolicies().then(setPolicyCatalog).catch(() => setPolicyCatalog([]));
  }, [open]);

  useEffect(() => {
    if (!open) return;
    if (mode === "create") {
      setName("");
      setDescription("");
      setPolicies([]);
      return;
    }
    if (!roleId) return;
    setLoading(true);
    iamService
      .getRole(roleId)
      .then((raw) => {
        const mapped = mapRole(raw);
        setName(mapped.name);
        setDescription(mapped.description || "");
        setPolicies(Array.isArray(raw.policies) ? raw.policies : mapped.policies || []);
      })
      .catch((err) => {
        toast.error(err?.friendlyMessage || "Could not load role.");
        onOpenChange(false);
      })
      .finally(() => setLoading(false));
  }, [open, mode, roleId, onOpenChange]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (readOnly) return;
    if (!name.trim()) {
      toast.error("Role name is required.");
      return;
    }
    if (isReservedRoleName(name)) {
      toast.error('Role names "Administrator" or starting with "Admin" are reserved.');
      return;
    }
    setBusy(true);
    try {
      const payload = {
        name: name.trim(),
        description: description.trim() || undefined,
        policies: resolvePolicyIds(policies),
        permissions: permissionIds,
      };
      if (mode === "create") {
        const created = await iamService.createRole(payload);
        toast.success(`Role "${name}" created`);
        onSaved?.(mapRole(created));
      } else {
        await iamService.updateRole(roleId, payload);
        toast.success("Role saved");
        onSaved?.();
      }
      onOpenChange(false);
    } catch (err) {
      toast.error(err?.friendlyMessage || "Could not save role.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg" data-testid={mode === "create" ? "create-role-dialog" : "edit-role-dialog"}>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{mode === "create" ? "Create role" : readOnly ? "View role" : "Edit role"}</DialogTitle>
            <DialogDescription>
              {readOnly
                ? "This role is FLB managed and cannot be edited here."
                : "Name, description, and attached policies. Use the permission matrix for direct grants."}
            </DialogDescription>
          </DialogHeader>
          {loading ? (
            <div className="py-8 text-sm text-[#4B5563]">Loading role…</div>
          ) : (
            <div className="space-y-4 py-2">
              <div className="space-y-1.5">
                <Label htmlFor="role-name">Role name</Label>
                <Input
                  id="role-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={readOnly}
                  data-testid="role-form-name"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="role-description">Description</Label>
                <Textarea
                  id="role-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  disabled={readOnly}
                  rows={3}
                  data-testid="role-form-description"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Attach policies</Label>
                <PolicyAttacher
                  available={policyCatalog}
                  value={policies}
                  onChange={setPolicies}
                  disabled={readOnly}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>
              Cancel
            </Button>
            {!readOnly && (
              <Button type="submit" disabled={busy || loading} data-testid="role-form-submit">
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : mode === "create" ? "Create role" : "Save changes"}
              </Button>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

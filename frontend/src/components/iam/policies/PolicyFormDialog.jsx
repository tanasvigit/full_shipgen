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
import { iamService } from "@/services/iam";
import { mapPolicy } from "@/lib/mappers";
import { toast } from "sonner";

export default function PolicyFormDialog({
  open,
  onOpenChange,
  mode = "create",
  policyId = null,
  permissionIds = [],
  onSaved,
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (mode === "create") {
      setName("");
      setDescription("");
      return;
    }
    if (!policyId) return;
    setLoading(true);
    iamService
      .getPolicy(policyId)
      .then((raw) => {
        const mapped = mapPolicy(raw);
        setName(mapped.name);
        setDescription(mapped.description || "");
      })
      .catch((err) => {
        toast.error(err?.friendlyMessage || "Could not load policy.");
        onOpenChange(false);
      })
      .finally(() => setLoading(false));
  }, [open, mode, policyId, onOpenChange]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Policy name is required.");
      return;
    }
    setBusy(true);
    try {
      const payload = {
        name: name.trim(),
        description: description.trim() || undefined,
        permissions: permissionIds,
      };
      if (mode === "create") {
        const created = await iamService.createPolicy(payload);
        toast.success(`Policy "${name}" created`);
        onSaved?.(mapPolicy(created));
      } else {
        await iamService.updatePolicy(policyId, payload);
        toast.success("Policy saved");
        onSaved?.();
      }
      onOpenChange(false);
    } catch (err) {
      toast.error(err?.friendlyMessage || "Could not save policy.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg" data-testid={mode === "create" ? "create-policy-dialog" : "edit-policy-dialog"}>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{mode === "create" ? "Create policy" : "Edit policy"}</DialogTitle>
            <DialogDescription>
              Name and description. Assign permissions using the matrix after selecting this policy.
            </DialogDescription>
          </DialogHeader>
          {loading ? (
            <div className="py-8 text-sm text-[#4B5563]">Loading policy…</div>
          ) : (
            <div className="space-y-4 py-2">
              <div className="space-y-1.5">
                <Label htmlFor="policy-name">Policy name</Label>
                <Input
                  id="policy-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  data-testid="policy-form-name"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="policy-description">Description</Label>
                <Textarea
                  id="policy-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  data-testid="policy-form-description"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>
              Cancel
            </Button>
            <Button type="submit" disabled={busy || loading} data-testid="policy-form-submit">
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : mode === "create" ? "Create policy" : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

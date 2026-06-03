import { useEffect, useMemo, useState } from "react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Search } from "lucide-react";
import { iamService } from "@/services/iam";
import { mapUser } from "@/lib/mappers";
import { toast } from "sonner";

export default function AddGroupMembersDialog({ open, onOpenChange, groupId, existingMemberIds = [], onAdded }) {
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState([]);
  const [selected, setSelected] = useState(() => new Set());
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);

  const existing = useMemo(() => new Set(existingMemberIds.map(String)), [existingMemberIds]);

  useEffect(() => {
    if (!open) {
      setQuery("");
      setSelected(new Set());
      setUsers([]);
      return;
    }
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const params = { limit: 50, page: 1, sort: "name" };
        if (query.trim()) params.query = query.trim();
        const rows = await iamService.listUsers(params);
        setUsers(rows.map(mapUser).filter((u) => !existing.has(String(u.id))));
      } catch {
        setUsers([]);
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [open, query, existingMemberIds]);

  const toggle = (id, checked) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (checked) next.add(String(id));
      else next.delete(String(id));
      return next;
    });
  };

  const handleSubmit = async () => {
    const ids = [...selected];
    if (!ids.length) {
      toast.error("Select at least one user.");
      return;
    }
    setBusy(true);
    try {
      await iamService.addGroupMembers(groupId, ids);
      toast.success(`Added ${ids.length} member(s).`);
      onAdded?.();
      onOpenChange(false);
    } catch (err) {
      toast.error(err?.friendlyMessage || "Could not add members.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md" data-testid="add-group-members-dialog">
        <DialogHeader>
          <DialogTitle>Add members</DialogTitle>
          <DialogDescription>Search IAM users in your organization to add to this group.</DialogDescription>
        </DialogHeader>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#4B5563]" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search users…"
            className="pl-9"
            data-testid="add-members-search"
          />
        </div>
        <div className="border border-black/[0.08] rounded-md max-h-56 overflow-y-auto">
          {loading && <div className="p-4 text-sm text-[#4B5563]">Searching…</div>}
          {!loading && users.length === 0 && (
            <div className="p-4 text-sm text-[#4B5563]">No users to add.</div>
          )}
          {users.map((u) => (
            <label
              key={u.id}
              className="flex items-center gap-3 px-3 py-2 border-b border-black/[0.06] last:border-0 cursor-pointer hover:bg-[#F5F6F8]"
            >
              <Checkbox checked={selected.has(String(u.id))} onCheckedChange={(v) => toggle(u.id, Boolean(v))} />
              <div className="min-w-0">
                <div className="text-sm font-medium truncate">{u.name}</div>
                <div className="text-xs text-[#4B5563] truncate">{u.email}</div>
              </div>
            </label>
          ))}
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>
            Cancel
          </Button>
          <Button type="button" onClick={handleSubmit} disabled={busy} data-testid="add-members-submit">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : `Add ${selected.size || ""} member(s)`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

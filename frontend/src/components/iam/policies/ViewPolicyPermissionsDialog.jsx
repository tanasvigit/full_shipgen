import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export default function ViewPolicyPermissionsDialog({ open, onOpenChange, policy }) {
  const permissions = policy?.permissions || [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl" data-testid="view-policy-permissions-dialog">
        <DialogHeader>
          <DialogTitle>Policy permissions — {policy?.name}</DialogTitle>
          <DialogDescription>
            {policy?.type || "Policy"} · {policy?.service || "all services"} · read-only (FLB managed)
          </DialogDescription>
        </DialogHeader>
        <div className="border border-black/[0.08] rounded-md overflow-hidden max-h-72 overflow-y-auto">
          <div className="grid grid-cols-2 gap-2 px-3 py-2 text-[10px] uppercase tracking-wider font-mono font-semibold text-[#4B5563] bg-[#F5F6F8] border-b border-black/[0.08]">
            <span>Permission</span>
            <span>Description</span>
          </div>
          {permissions.length === 0 ? (
            <div className="px-3 py-8 text-sm text-[#4B5563] text-center">No permissions on this policy.</div>
          ) : (
            permissions.map((p) => (
              <div
                key={p?.id || p?.name}
                className="grid grid-cols-2 gap-2 px-3 py-2 text-xs border-b border-black/[0.06] last:border-0"
              >
                <span className="truncate font-mono">{p?.name || p?.slug}</span>
                <span className="truncate text-[#4B5563]">{p?.description || "—"}</span>
              </div>
            ))
          )}
        </div>
        <DialogFooter>
          <Button type="button" onClick={() => onOpenChange(false)}>
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

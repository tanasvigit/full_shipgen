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
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2 } from "lucide-react";
import { iamService } from "@/services/iam";
import { resolveIamUserUuid } from "@/lib/iam/userIds";
import { mapUser } from "@/lib/mappers";
import { toast } from "sonner";

const PASSWORD_HINT =
  "At least 8 characters with uppercase, lowercase, a number, and a symbol (not found in known breaches).";

export default function ChangeUserPasswordDialog({ open, onOpenChange, user, onSuccess }) {
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [sendCredentials, setSendCredentials] = useState(false);
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState("");
  const [targetUuid, setTargetUuid] = useState(null);

  useEffect(() => {
    if (!open || !user) {
      setTargetUuid(null);
      return;
    }

    const fromRow = resolveIamUserUuid(user);
    if (fromRow) {
      setTargetUuid(fromRow);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const full = await iamService.getUser(user.id);
        if (cancelled) return;
        const mapped = mapUser(full);
        setTargetUuid(resolveIamUserUuid(mapped) || resolveIamUserUuid(full));
      } catch {
        if (!cancelled) setTargetUuid(null);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [open, user]);

  const reset = () => {
    setPassword("");
    setPasswordConfirmation("");
    setSendCredentials(false);
    setFormError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setFormError("");
    if (password !== passwordConfirmation) {
      const message = "Passwords do not match.";
      setFormError(message);
      toast.error(message);
      return;
    }
    if (!targetUuid) {
      setFormError("Could not resolve this user. Refresh and try again.");
      return;
    }
    setBusy(true);
    try {
      await iamService.changeUserPassword({
        userId: targetUuid,
        password,
        password_confirmation: passwordConfirmation,
        send_credentials: sendCredentials,
      });
      toast.success("Password updated.");
      reset();
      onOpenChange(false);
      onSuccess?.();
    } catch (err) {
      const message = err?.friendlyMessage || "Failed to change password.";
      setFormError(message);
      toast.error(message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) reset();
        onOpenChange(v);
      }}
    >
      <DialogContent
        data-testid="change-user-password-dialog"
        onOpenAutoFocus={(e) => e.preventDefault()}
        onCloseAutoFocus={(e) => e.preventDefault()}
      >
        <form onSubmit={handleSubmit} autoComplete="off" onClick={(e) => e.stopPropagation()}>
          <DialogHeader>
            <DialogTitle>Change password</DialogTitle>
            <DialogDescription>Set a new password for {user?.name || "this user"}.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-xs text-[#4B5563]">{PASSWORD_HINT}</p>
            {formError ? (
              <p className="text-sm text-red-600" role="alert" data-testid="change-password-error">
                {formError}
              </p>
            ) : null}
            <div className="space-y-1.5">
              <Label htmlFor="new-password">New password</Label>
              <Input
                id="new-password"
                type="password"
                autoComplete="off"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                data-testid="change-password-new"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="confirm-password">Confirm password</Label>
              <Input
                id="confirm-password"
                type="password"
                autoComplete="off"
                value={passwordConfirmation}
                onChange={(e) => setPasswordConfirmation(e.target.value)}
                required
                data-testid="change-password-confirm"
              />
            </div>
            <label className="flex items-center gap-2 text-sm text-[#374151]">
              <Checkbox checked={sendCredentials} onCheckedChange={(v) => setSendCredentials(Boolean(v))} />
              Email credentials to user
            </label>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>
              Cancel
            </Button>
            <Button type="submit" disabled={busy} data-testid="change-password-submit">
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Update password"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

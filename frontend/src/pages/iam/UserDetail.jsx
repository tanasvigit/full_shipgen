import { useParams, useNavigate } from "react-router-dom";
import PageHeader from "@/components/common/PageHeader";
import StatusBadge from "@/components/common/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Mail, ShieldCheck, KeyRound } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { iamService } from "@/services/iam";
import { mapUser, statusLabel } from "@/lib/mappers";

export default function UserDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [u, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [twoFa, setTwoFa] = useState(false);

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      try {
        const response = await iamService.getUser(id);
        if (!active) return;
        const mapped = mapUser(response);
        setUser(mapped);
        setName(mapped.name);
        setEmail(mapped.email);
        setTwoFa(mapped.twoFa);
      } catch (err) {
        if (!active) return;
        setUser(null);
        const status = err?.response?.status;
        if (status === 404) toast.error("User not found.");
        else if (status === 403) toast.error("You cannot view this user.");
        else toast.error(err?.friendlyMessage || "Could not load user.");
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => {
      active = false;
    };
  }, [id]);

  if (loading) {
    return <div className="p-8 text-[#374151]">Loading user…</div>;
  }
  if (!u) {
    return <div className="p-8 text-[#374151]">User not found.</div>;
  }

  return (
    <div data-testid="user-detail-page">
      <PageHeader
        breadcrumbs={[
          { label: "IAM", to: "/iam" },
          { label: "Users", to: "/iam/users" },
          { label: u.name },
        ]}
        overline="User"
        title={u.name}
        description={
          <span className="flex items-center gap-2 flex-wrap">
            <StatusBadge status={u.status} label={statusLabel(u.status)} /> <span className="text-xs font-mono text-[#4B5563]">{u.email}</span>
          </span>
        }
        actions={
          <Button variant="outline" onClick={() => navigate(-1)} className="bg-transparent border-black/[0.08] hover:bg-[#F1F2F5] text-[#1F2937]">
            <ArrowLeft className="h-4 w-4 mr-1" /> Back
          </Button>
        }
      />
      <div className="p-6 max-w-4xl space-y-4">
        <div className="bg-white border border-black/[0.08] rounded-md p-5 space-y-4">
          <div className="overline">Profile</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs uppercase tracking-wider font-mono text-[#374151]">Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} className="bg-[#F1F2F5] border-black/[0.08]" data-testid="user-name" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs uppercase tracking-wider font-mono text-[#374151]">Email</Label>
              <Input value={email} onChange={(e) => setEmail(e.target.value)} className="bg-[#F1F2F5] border-black/[0.08]" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs uppercase tracking-wider font-mono text-[#374151]">Role</Label>
              <Input value={u.role} disabled className="bg-[#F1F2F5] border-black/[0.08]" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs uppercase tracking-wider font-mono text-[#374151]">Last login</Label>
              <Input value={u.lastLogin} disabled className="bg-[#F1F2F5] border-black/[0.08] font-mono text-xs" />
            </div>
          </div>
        </div>

        <div className="bg-white border border-black/[0.08] rounded-md p-5 space-y-4">
          <div className="overline">Security</div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <ShieldCheck className="h-4 w-4 text-[#374151]" />
              <div>
                <div className="font-medium text-sm">Two-factor authentication</div>
                <div className="text-xs text-[#4B5563]">Reflects user security settings from the API.</div>
              </div>
            </div>
            <Switch
              checked={twoFa}
              onCheckedChange={async (v) => {
                const prev = twoFa;
                setTwoFa(v);
                try {
                  await iamService.updateUser(u.id, { two_factor_enabled: v });
                  toast.success("2FA preference updated");
                } catch (err) {
                  setTwoFa(prev);
                  if (err?.response?.status === 403) toast.error("You cannot change 2FA for this user.");
                  else toast.error(err?.friendlyMessage || "Failed to update 2FA.");
                }
              }}
              data-testid="user-2fa-switch"
            />
          </div>
          <div className="flex items-center justify-between pt-3 border-t border-black/[0.08]">
            <div className="flex items-center gap-3">
              <KeyRound className="h-4 w-4 text-[#374151]" />
              <div>
                <div className="font-medium text-sm">Password reset</div>
                <div className="text-xs text-[#4B5563]">Use your admin tools or identity provider where password reset is not exposed via API.</div>
              </div>
            </div>
            <Button
              variant="outline"
              onClick={() => toast.info("Password flows are enforced server-side; use Fleetbase admin or IdP reset where available.")}
              className="bg-transparent border-black/[0.08] hover:bg-[#F1F2F5] text-[#1F2937]"
              data-testid="user-reset-password"
            >
              <Mail className="h-3.5 w-3.5 mr-1" /> Reset help
            </Button>
          </div>
        </div>

        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={async () => {
              const next = u.status === "disabled" ? "active" : "disabled";
              try {
                await iamService.updateUser(u.id, { status: next });
                setUser((prev) => ({ ...prev, status: next }));
                toast.success(next === "disabled" ? "User disabled" : "User enabled");
              } catch (err) {
                if (err?.response?.status === 403) toast.error("You cannot change this user’s status.");
                else toast.error(err?.friendlyMessage || "Failed to update user.");
              }
            }}
            className="bg-transparent border-red-500/40 text-[#B91C1C] hover:bg-red-500/10"
            data-testid="user-disable"
          >
            {u.status === "disabled" ? "Enable user" : "Disable user"}
          </Button>
          <Button
            onClick={async () => {
              try {
                await iamService.updateUser(u.id, { name, email, two_factor_enabled: twoFa });
                const refreshed = await iamService.getUser(u.id);
                const mapped = mapUser(refreshed);
                setUser(mapped);
                setName(mapped.name);
                setEmail(mapped.email);
                setTwoFa(mapped.twoFa);
                toast.success("Changes saved");
              } catch (err) {
                if (err?.response?.status === 403) toast.error("You cannot edit this user.");
                else toast.error(err?.friendlyMessage || "Failed to save changes.");
              }
            }}
            className="bg-blue-600 hover:bg-blue-700"
            data-testid="user-save"
          >
            Save changes
          </Button>
        </div>
      </div>
    </div>
  );
}

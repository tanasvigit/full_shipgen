import { useParams, useNavigate } from "react-router-dom";
import PageHeader from "@/components/common/PageHeader";
import StatusBadge from "@/components/common/StatusBadge";
import UserPermissionsDialog from "@/components/iam/users/UserPermissionsDialog";
import ChangeUserPasswordDialog from "@/components/iam/users/ChangeUserPasswordDialog";
import UserAccessSection from "@/components/iam/users/UserAccessSection";
import { normalizeIamPhone } from "@/lib/iam/phone";
import {
  directPermissionIdsFromUser,
  policiesFromUserRaw,
  resolvePermissionIds,
  resolvePolicyIds,
} from "@/lib/iam/userPayload";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  ArrowLeft,
  KeyRound,
  Mail,
  ShieldCheck,
  UserMinus,
  UserCheck,
  UserX,
  BadgeCheck,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { iamService } from "@/services/iam";
import { mapRole, mapUser, statusLabel } from "@/lib/mappers";
import { useIamAbility } from "@/hooks/iam/useIamAbility";

export default function UserDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const ability = useIamAbility();
  const [u, setUser] = useState(null);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [country, setCountry] = useState("");
  const [roleId, setRoleId] = useState("");
  const [twoFa, setTwoFa] = useState(false);
  const [policyCatalog, setPolicyCatalog] = useState([]);
  const [permissionRows, setPermissionRows] = useState([]);
  const [policies, setPolicies] = useState([]);
  const [permissionIds, setPermissionIds] = useState(() => new Set());
  const [permissionsOpen, setPermissionsOpen] = useState(false);
  const [passwordOpen, setPasswordOpen] = useState(false);

  const loadUser = useCallback(async () => {
    setLoading(true);
    try {
      const [response, permRows] = await Promise.all([iamService.getUser(id), iamService.listPermissions()]);
      setPermissionRows(permRows);
      const mapped = mapUser(response);
      setUser(mapped);
      setName(mapped.name);
      setEmail(mapped.email);
      setPhone(mapped.phone || "");
      setCountry(mapped.country || response?.country || "");
      setRoleId(mapped.roleId ? String(mapped.roleId) : "");
      setTwoFa(mapped.twoFa);
      setPolicies(policiesFromUserRaw(response));
      setPermissionIds(directPermissionIdsFromUser(response, permRows));
    } catch (err) {
      setUser(null);
      const status = err?.response?.status;
      if (status === 404) toast.error("User not found.");
      else if (status === 403) toast.error("You cannot view this user.");
      else toast.error(err?.friendlyMessage || "Could not load user.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  useEffect(() => {
    iamService
      .listRoles()
      .then((rows) => setRoles(rows.map(mapRole)))
      .catch(() => setRoles([]));
    iamService.listPolicies({ limit: 100, sort: "name" }).then(setPolicyCatalog).catch(() => setPolicyCatalog([]));
  }, []);

  if (loading) {
    return <div className="p-8 text-[#374151]">Loading user…</div>;
  }
  if (!u) {
    return <div className="p-8 text-[#374151]">User not found.</div>;
  }

  const sessionStatus = u.sessionStatus || u.status;

  const runLifecycle = async (label, fn, { after } = {}) => {
    if (!window.confirm(`${label} for ${u.name}?`)) return;
    try {
      await fn();
      toast.success("Done");
      if (after) after();
      else await loadUser();
    } catch (err) {
      toast.error(err?.friendlyMessage || "Action failed.");
    }
  };

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
            <StatusBadge status={sessionStatus} label={statusLabel(sessionStatus)} />
            <span className="text-xs font-mono text-[#4B5563]">{u.email}</span>
          </span>
        }
        actions={
          <Button
            variant="outline"
            onClick={() => navigate(-1)}
            className="bg-transparent border-black/[0.08] hover:bg-[#F1F2F5] text-[#1F2937]"
          >
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
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={!ability.canUpdateUser}
                className="bg-[#F1F2F5] border-black/[0.08]"
                data-testid="user-name"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs uppercase tracking-wider font-mono text-[#374151]">Email</Label>
              <Input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={!ability.canUpdateUser}
                className="bg-[#F1F2F5] border-black/[0.08]"
                data-testid="user-email"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs uppercase tracking-wider font-mono text-[#374151]">Phone</Label>
              <Input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                disabled={!ability.canUpdateUser}
                className="bg-[#F1F2F5] border-black/[0.08]"
                data-testid="user-phone"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs uppercase tracking-wider font-mono text-[#374151]">Country</Label>
              <Input
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                disabled={!ability.canUpdateUser}
                maxLength={2}
                className="bg-[#F1F2F5] border-black/[0.08] uppercase"
                data-testid="user-country"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs uppercase tracking-wider font-mono text-[#374151]">Role</Label>
              <Select value={roleId} onValueChange={setRoleId} disabled={!ability.canUpdateUser}>
                <SelectTrigger className="bg-[#F1F2F5] border-black/[0.08]" data-testid="user-role-select">
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
            <div className="space-y-1.5">
              <Label className="text-xs uppercase tracking-wider font-mono text-[#374151]">Last login</Label>
              <Input value={u.lastLogin} disabled className="bg-[#F1F2F5] border-black/[0.08] font-mono text-xs" />
            </div>
          </div>
        </div>

        {ability.canUpdateUser && (
          <div className="bg-white border border-black/[0.08] rounded-md p-5 space-y-4" data-testid="user-access-control-card">
            <div className="overline">Access control</div>
            <UserAccessSection
              policyCatalog={policyCatalog}
              policies={policies}
              onPoliciesChange={setPolicies}
              permissionRows={permissionRows}
              selectedPermissionIds={permissionIds}
              onPermissionsChange={setPermissionIds}
              disabled={!ability.canUpdateUser}
            />
          </div>
        )}

        <div className="bg-white border border-black/[0.08] rounded-md p-5 space-y-4">
          <div className="overline">Security</div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <ShieldCheck className="h-4 w-4 text-[#374151]" />
              <div>
                <div className="font-medium text-sm">Two-factor authentication</div>
                <div className="text-xs text-[#4B5563]">User security settings from the API.</div>
              </div>
            </div>
            <Switch
              checked={twoFa}
              disabled={!ability.canUpdateUser}
              onCheckedChange={async (v) => {
                const prev = twoFa;
                setTwoFa(v);
                try {
                  await iamService.updateUser(u.id, { two_factor_enabled: v });
                  toast.success("2FA preference updated");
                } catch (err) {
                  setTwoFa(prev);
                  toast.error(err?.friendlyMessage || "Failed to update 2FA.");
                }
              }}
              data-testid="user-2fa-switch"
            />
          </div>
          {ability.canViewUser && (
            <div className="flex flex-wrap gap-2 pt-2 border-t border-black/[0.08]">
              <Button variant="outline" size="sm" onClick={() => setPermissionsOpen(true)} data-testid="user-view-permissions">
                View permissions
              </Button>
              {ability.canChangePasswordForUser && (
                <Button variant="outline" size="sm" onClick={() => setPasswordOpen(true)} data-testid="user-change-password">
                  <KeyRound className="h-3.5 w-3.5 mr-1" /> Change password
                </Button>
              )}
            </div>
          )}
        </div>

        <div className="bg-white border border-black/[0.08] rounded-md p-5 space-y-3">
          <div className="overline">Account actions</div>
          <div className="flex flex-wrap gap-2">
            {ability.canUpdateUser && sessionStatus === "pending" && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => runLifecycle("Resend invitation", () => iamService.resendInvite(u.id))}
                data-testid="user-resend-invite"
              >
                <Mail className="h-3.5 w-3.5 mr-1" /> Resend invitation
              </Button>
            )}
            {ability.canDeactivateUser && sessionStatus === "active" && (
              <Button
                variant="outline"
                size="sm"
                className="text-red-600 border-red-200"
                onClick={() => runLifecycle("Deactivate", () => iamService.deactivateUser(u.id))}
                data-testid="user-deactivate"
              >
                <UserX className="h-3.5 w-3.5 mr-1" /> Deactivate
              </Button>
            )}
            {ability.canActivateUser && (sessionStatus === "inactive" || sessionStatus === "pending") && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => runLifecycle("Activate", () => iamService.activateUser(u.id))}
                data-testid="user-activate"
              >
                <UserCheck className="h-3.5 w-3.5 mr-1" /> Activate
              </Button>
            )}
            {ability.canVerifyUser && !u.emailVerified && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => runLifecycle("Verify email", () => iamService.verifyUser(u.id))}
                data-testid="user-verify"
              >
                <BadgeCheck className="h-3.5 w-3.5 mr-1" /> Verify
              </Button>
            )}
            {ability.canDeleteUser && (
              <Button
                variant="outline"
                size="sm"
                className="text-red-600 border-red-200"
                onClick={() =>
                  runLifecycle("Remove from company", () => iamService.removeFromCompany(u.id), {
                    after: () => navigate("/iam/users"),
                  })
                }
                data-testid="user-remove-company"
              >
                <UserMinus className="h-3.5 w-3.5 mr-1" /> Remove from company
              </Button>
            )}
          </div>
        </div>

        {ability.canUpdateUser && (
          <div className="flex justify-end">
            <Button
              onClick={async () => {
                try {
                  const normalizedPhone = normalizeIamPhone(phone);
                  await iamService.updateUser(u.id, {
                    user: {
                      name,
                      email,
                      ...(normalizedPhone ? { phone: normalizedPhone } : {}),
                      ...(country.trim() ? { country: country.trim().toUpperCase().slice(0, 2) } : {}),
                      role: roleId,
                      two_factor_enabled: twoFa,
                      policies: resolvePolicyIds(policies),
                      permissions: resolvePermissionIds(permissionIds),
                    },
                  });
                  await loadUser();
                  toast.success("Changes saved");
                } catch (err) {
                  toast.error(err?.friendlyMessage || "Failed to save changes.");
                }
              }}
              className="bg-blue-600 hover:bg-blue-700"
              data-testid="user-save"
            >
              Save changes
            </Button>
          </div>
        )}
      </div>

      <UserPermissionsDialog open={permissionsOpen} onOpenChange={setPermissionsOpen} user={u} />
      <ChangeUserPasswordDialog open={passwordOpen} onOpenChange={setPasswordOpen} user={u} />
    </div>
  );
}

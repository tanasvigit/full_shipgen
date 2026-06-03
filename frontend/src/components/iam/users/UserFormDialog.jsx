import { useCallback, useEffect, useState } from "react";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Upload } from "lucide-react";
import { toast } from "sonner";
import { iamService } from "@/services/iam";
import { filesService } from "@/services/files";
import { mapRole, mapUser } from "@/lib/mappers";
import { normalizeIamPhone } from "@/lib/iam/phone";
import {
  directPermissionIdsFromUser,
  policiesFromUserRaw,
  resolvePermissionIds,
  resolvePolicyIds,
} from "@/lib/iam/userPayload";
import UserAccessSection from "@/components/iam/users/UserAccessSection";
import { useIamAbility } from "@/hooks/iam/useIamAbility";
import { useAuth } from "@/contexts/AuthContext";
import { t } from "@/i18n";

const EMPTY = {
  name: "",
  email: "",
  phone: "",
  country: "",
  roleId: "",
};

export default function UserFormDialog({
  open,
  onOpenChange,
  mode = "create",
  userId = null,
  userType = "user",
  onSaved,
}) {
  const ability = useIamAbility();
  const { activeOrganization } = useAuth();
  const isCreate = mode === "create";
  const canManageAccess = isCreate ? ability.canCreateUser : ability.canUpdateUser;

  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [roles, setRoles] = useState([]);
  const [policyCatalog, setPolicyCatalog] = useState([]);
  const [permissionRows, setPermissionRows] = useState([]);
  const [policies, setPolicies] = useState([]);
  const [permissionIds, setPermissionIds] = useState(() => new Set());
  const [avatarUuid, setAvatarUuid] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const loadCatalog = useCallback(async () => {
    const [roleRows, policyRows, permRows] = await Promise.all([
      iamService.listRoles({ limit: 100 }),
      iamService.listPolicies({ limit: 100, sort: "name" }),
      iamService.listPermissions(),
    ]);
    setRoles(roleRows.map(mapRole));
    setPolicyCatalog(policyRows);
    setPermissionRows(permRows);
    return { permRows };
  }, []);

  useEffect(() => {
    if (!open) return;
    setError(null);
    setBusy(false);

    (async () => {
      setLoading(true);
      try {
        const { permRows } = await loadCatalog();
        if (isCreate) {
          setForm(EMPTY);
          setPolicies([]);
          setPermissionIds(new Set());
          setAvatarUuid(null);
          setAvatarPreview(null);
        } else if (userId) {
          const raw = await iamService.getUser(userId);
          const mapped = mapUser(raw);
          setForm({
            name: mapped.name,
            email: mapped.email,
            phone: mapped.phone || "",
            country: mapped.country || raw?.country || "",
            roleId: mapped.roleId ? String(mapped.roleId) : "",
          });
          setPolicies(policiesFromUserRaw(raw));
          setPermissionIds(directPermissionIdsFromUser(raw, permRows));
          setAvatarUuid(raw?.avatar_uuid || null);
          setAvatarPreview(mapped.avatarUrl || null);
        }
      } catch (err) {
        setError(err?.friendlyMessage || "Could not load user form.");
      } finally {
        setLoading(false);
      }
    })();
  }, [open, isCreate, userId, loadCatalog]);

  const setField = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const onAvatarPick = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !canManageAccess) return;
    setUploadingAvatar(true);
    try {
      const companyId = activeOrganization?.uuid || activeOrganization?.id || "company";
      const slug = String(form.name || "user")
        .toLowerCase()
        .replace(/\s+/g, "-")
        .slice(0, 40);
      const raw = await filesService.upload(file, {
        type: "user_photo",
        path: `uploads/${companyId}/users/${slug || "new"}`,
      });
      const normalized = filesService.normalizeFile(raw);
      setAvatarUuid(normalized?.id || raw?.uuid || raw?.id);
      setAvatarPreview(normalized?.url || raw?.url);
      toast.success("Photo uploaded");
    } catch (err) {
      toast.error(err?.friendlyMessage || "Upload failed.");
    } finally {
      setUploadingAvatar(false);
      e.target.value = "";
    }
  };

  const buildUserPayload = () => {
    const phone = normalizeIamPhone(form.phone);
    const base = {
      name: form.name.trim(),
      email: form.email.trim().toLowerCase(),
      ...(phone ? { phone } : {}),
      ...(form.country?.trim() ? { country: form.country.trim().toUpperCase().slice(0, 2) } : {}),
      ...(avatarUuid ? { avatar_uuid: avatarUuid } : {}),
    };

    if (canManageAccess) {
      base.policies = resolvePolicyIds(policies);
      base.permissions = resolvePermissionIds(permissionIds);
    }

    if (isCreate) {
      return {
        user: {
          ...base,
          role_uuid: form.roleId,
          type: userType === "driver" ? "driver" : userType === "customer" ? "customer" : "user",
        },
      };
    }

    return {
      user: {
        ...base,
        role: form.roleId,
      },
    };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim()) {
      setError(t("iam.users.form.requiredProfile", "Name and email are required."));
      return;
    }
    if (isCreate && !form.roleId) {
      setError(t("iam.users.form.requiredCreate", "Role is required."));
      return;
    }

    setBusy(true);
    setError(null);
    try {
      const payload = buildUserPayload();
      let saved;
      if (isCreate) {
        saved = await iamService.createUser(payload);
      } else {
        saved = await iamService.updateUser(userId, payload);
      }
      const mapped = mapUser(saved);
      onSaved?.(mapped);
      onOpenChange(false);
      toast.success(isCreate ? `User ${form.email} created` : "User saved");
    } catch (err) {
      const msg =
        err?.friendlyMessage ||
        err?.response?.data?.errors?.[0] ||
        err?.message ||
        "Save failed.";
      setError(msg);
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto" data-testid="user-form-dialog">
        <DialogHeader>
          <DialogTitle>
            {isCreate ? t("iam.users.form.createTitle", "Create user") : t("iam.users.form.editTitle", "Edit user")}
          </DialogTitle>
          <DialogDescription>
            {isCreate
              ? t(
                  "iam.users.form.createDescription",
                  "Assign role and access. User receives an invite; set password from user detail or Change password.",
                )
              : t("iam.users.form.editDescription", "Update profile and access grants.")}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="py-12 flex justify-center text-[#6B7280]">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="flex gap-4">
              <div className="shrink-0 space-y-2">
                <div className="h-24 w-24 rounded-md border border-black/[0.08] bg-[#F5F6F8] overflow-hidden grid place-items-center">
                  {avatarPreview ? (
                    <img src={avatarPreview} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-[10px] text-[#9CA3AF] font-mono">Photo</span>
                  )}
                </div>
                <label className="inline-flex">
                  <input
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    disabled={!canManageAccess || uploadingAvatar}
                    onChange={onAvatarPick}
                    data-testid="user-form-avatar-input"
                  />
                  <Button type="button" variant="outline" size="sm" className="h-8 text-xs" asChild disabled={!canManageAccess}>
                    <span>
                      <Upload className="h-3 w-3 mr-1" />
                      {uploadingAvatar ? "Uploading…" : "Upload"}
                    </span>
                  </Button>
                </label>
              </div>
              <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1.5 md:col-span-2">
                  <Label className="text-xs uppercase tracking-wider font-mono">{t("iam.users.form.name", "Full name")}</Label>
                  <Input
                    value={form.name}
                    onChange={(e) => setField("name", e.target.value)}
                    required
                    disabled={!canManageAccess && !isCreate}
                    data-testid="user-form-name"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs uppercase tracking-wider font-mono">{t("iam.users.form.email", "Email")}</Label>
                  <Input
                    type="email"
                    value={form.email}
                    onChange={(e) => setField("email", e.target.value)}
                    required
                    disabled={!isCreate}
                    data-testid="user-form-email"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs uppercase tracking-wider font-mono">{t("iam.users.form.phone", "Phone")}</Label>
                  <Input
                    value={form.phone}
                    onChange={(e) => setField("phone", e.target.value)}
                    placeholder="+919878589658"
                    disabled={!canManageAccess && !isCreate}
                    data-testid="user-form-phone"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs uppercase tracking-wider font-mono">{t("iam.users.form.country", "Country")}</Label>
                  <Input
                    value={form.country}
                    onChange={(e) => setField("country", e.target.value)}
                    maxLength={2}
                    placeholder="US"
                    className="uppercase"
                    disabled={!canManageAccess && !isCreate}
                    data-testid="user-form-country"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs uppercase tracking-wider font-mono">{t("iam.users.form.role", "Role")}</Label>
                  <Select value={form.roleId} onValueChange={(v) => setField("roleId", v)} disabled={!canManageAccess}>
                    <SelectTrigger data-testid="user-form-role">
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
              </div>
            </div>

            {canManageAccess && (
              <UserAccessSection
                policyCatalog={policyCatalog}
                policies={policies}
                onPoliciesChange={setPolicies}
                permissionRows={permissionRows}
                selectedPermissionIds={permissionIds}
                onPermissionsChange={setPermissionIds}
                disabled={busy}
              />
            )}

            {error && (
              <p className="text-sm text-red-600" data-testid="user-form-error">
                {error}
              </p>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>
                {t("iam.users.form.cancel", "Cancel")}
              </Button>
              <Button type="submit" disabled={busy} className="bg-[#0066FF] hover:bg-[#0040CC] text-white" data-testid="user-form-submit">
                {busy ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                {isCreate ? t("iam.users.form.submitCreate", "Create user") : t("iam.users.form.submitSave", "Save")}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

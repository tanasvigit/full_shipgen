import { useMemo, useState } from "react";
import PolicyAttacher from "@/components/iam/roles/PolicyAttacher";
import PermissionMatrixPanel from "@/components/iam/shared/PermissionMatrixPanel";
import { Input } from "@/components/ui/input";
import { t } from "@/i18n";

export default function UserAccessSection({
  policyCatalog = [],
  policies = [],
  onPoliciesChange,
  permissionRows = [],
  selectedPermissionIds,
  onPermissionsChange,
  disabled = false,
  readOnlyEffective = false,
}) {
  const [search, setSearch] = useState("");
  const grantIds = useMemo(
    () => (selectedPermissionIds instanceof Set ? selectedPermissionIds : new Set(selectedPermissionIds || [])),
    [selectedPermissionIds],
  );

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return permissionRows;
    return permissionRows.filter((p) => {
      const slug = String(p.slug || p.name || "").toLowerCase();
      const name = String(p.name || "").toLowerCase();
      return slug.includes(q) || name.includes(q);
    });
  }, [permissionRows, search]);

  const togglePerm = (perm) => {
    if (!perm?.id || disabled || readOnlyEffective) return;
    const id = String(perm.id);
    const next = new Set(grantIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onPermissionsChange?.(next);
  };

  if (readOnlyEffective) {
    return (
      <p className="text-xs text-[#6B7280]">{t("iam.users.form.accessReadOnly", "Access is read-only.")}</p>
    );
  }

  return (
    <div className="space-y-5" data-testid="user-access-section">
      <div>
        <div className="text-xs font-semibold uppercase tracking-wider text-[#374151] mb-2">
          {t("iam.users.form.attachPolicies", "Attach policies")}
        </div>
        <div data-testid="user-policy-attacher">
          <PolicyAttacher
            available={policyCatalog}
            value={policies}
            onChange={onPoliciesChange}
            disabled={disabled}
          />
        </div>
      </div>
      <div>
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="text-xs font-semibold uppercase tracking-wider text-[#374151]">
            {t("iam.users.form.directPermissions", "Direct permissions")}
          </div>
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("iam.users.form.searchPermissions", "Search permissions…")}
            className="h-8 max-w-[220px] text-xs bg-[#F5F6F8] border-black/[0.08]"
            disabled={disabled}
            data-testid="user-permission-search"
          />
        </div>
        <div
          className="border border-black/[0.08] rounded-md max-h-64 overflow-y-auto"
          data-testid="user-permission-matrix"
        >
          <PermissionMatrixPanel
            permissionRows={filteredRows}
            selectedIds={grantIds}
            onToggle={togglePerm}
            disabled={disabled}
            testIdPrefix="user-perm"
          />
        </div>
      </div>
    </div>
  );
}

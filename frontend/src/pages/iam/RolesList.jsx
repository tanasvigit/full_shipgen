import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import PageHeader from "@/components/common/PageHeader";
import RoleFormDialog from "@/components/iam/roles/RoleFormDialog";
import RoleListItemActions from "@/components/iam/roles/RoleListItemActions";
import PolicyAttacher from "@/components/iam/roles/PolicyAttacher";
import ViewRolePermissionsDialog from "@/components/iam/roles/ViewRolePermissionsDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Lock, Check, Minus, Download, RefreshCw, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { iamService } from "@/services/iam";
import { mapPermission, mapRole } from "@/lib/mappers";
import { useRolesListPage } from "@/hooks/iam/useRolesListPage";
import { useIamAbility } from "@/hooks/iam/useIamAbility";
import { IAM_SCHEME_TYPES, schemeTypeLabel } from "@/lib/iam/schemeTypes";

const STD_ACTIONS = ["view", "create", "update", "delete", "dispatch", "cancel", "impersonate", "manage"];

function moduleKeyFromSlug(slug) {
  const s = String(slug || "");
  const i = s.lastIndexOf(".");
  return i > 0 ? s.slice(0, i) : "general";
}

function actionFromSlug(slug) {
  const s = String(slug || "");
  const i = s.lastIndexOf(".");
  const raw = i > 0 ? s.slice(i + 1) : s;
  const a = raw.toLowerCase();
  if (STD_ACTIONS.includes(a)) return a;
  return "manage";
}

function resolveGrantedIds(role, permissionRows) {
  const mappedAll = permissionRows.map(mapPermission);
  const raw = role?.permissions || role?.permission_records || role?.assigned_permissions || [];
  const out = new Set();
  raw.forEach((item) => {
    if (item && typeof item === "object" && (item.id || item.uuid)) {
      out.add(String(item.id || item.uuid));
      return;
    }
    const slug = typeof item === "string" ? item : item?.slug || item?.name;
    if (!slug) return;
    const hit = mappedAll.find((m) => m.slug === slug || String(m.id) === slug);
    if (hit?.id) out.add(String(hit.id));
  });
  return out;
}

export default function RolesList() {
  const ability = useIamAbility();
  const { queryState, patchQuery, roles, loading, meta, reload } = useRolesListPage();

  const [services, setServices] = useState([]);
  const [policyCatalog, setPolicyCatalog] = useState([]);
  const [permList, setPermList] = useState([]);
  const [activeRole, setActiveRole] = useState(null);
  const [grantIds, setGrantIds] = useState(() => new Set());
  const [rolePolicies, setRolePolicies] = useState([]);
  const [dirty, setDirty] = useState(false);
  const [policiesDirty, setPoliciesDirty] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [editRoleId, setEditRoleId] = useState(null);
  const [viewPermsRole, setViewPermsRole] = useState(null);
  const [roleLoading, setRoleLoading] = useState(false);
  const [searchDraft, setSearchDraft] = useState(queryState.query);
  const [selectedRoleIds, setSelectedRoleIds] = useState(() => new Set());
  const [bulkBusy, setBulkBusy] = useState(false);
  const searchDebounceRef = useRef(null);

  const permsMapped = useMemo(() => permList.map((p) => mapPermission(p)), [permList]);

  const modules = useMemo(() => {
    const m = new Set();
    permsMapped.forEach((p) => m.add(moduleKeyFromSlug(p.slug)));
    return [...m].sort();
  }, [permsMapped]);

  const tableActions = useMemo(() => {
    const a = new Set();
    permsMapped.forEach((p) => a.add(actionFromSlug(p.slug)));
    return STD_ACTIONS.filter((x) => a.has(x));
  }, [permsMapped]);

  const findPerm = (module, action) =>
    permsMapped.find((p) => moduleKeyFromSlug(p.slug) === module && actionFromSlug(p.slug) === action);

  useEffect(() => {
    setSearchDraft(queryState.query);
  }, [queryState.query]);

  useEffect(() => {
    iamService.getAuthServices().then(setServices).catch(() => setServices([]));
    iamService.listPolicies().then(setPolicyCatalog).catch(() => setPolicyCatalog([]));
    iamService
      .listPermissions()
      .then(setPermList)
      .catch(() => setPermList([]));
  }, []);

  useEffect(() => {
    if (!loading && roles.length && !roles.some((r) => r.id === activeRole)) {
      setActiveRole(roles[0]?.id || null);
    }
    if (!loading && !roles.length) setActiveRole(null);
  }, [loading, roles, activeRole]);

  const handleSearchChange = useCallback(
    (value) => {
      setSearchDraft(value);
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
      searchDebounceRef.current = setTimeout(() => patchQuery({ query: value, page: 1 }), 250);
    },
    [patchQuery],
  );

  const hydrateRole = useCallback(
    async (roleId) => {
      if (!roleId) {
        setGrantIds(new Set());
        setRolePolicies([]);
        setDirty(false);
        setPoliciesDirty(false);
        return;
      }
      setRoleLoading(true);
      try {
        const raw = await iamService.getRole(roleId);
        setGrantIds(resolveGrantedIds(raw, permList));
        setRolePolicies(Array.isArray(raw.policies) ? raw.policies : []);
        setDirty(false);
        setPoliciesDirty(false);
      } catch (err) {
        if (err?.response?.status === 403) toast.error("You cannot view this role’s permissions.");
        else toast.error(err?.friendlyMessage || "Could not load role details.");
        setGrantIds(new Set());
        setRolePolicies([]);
      } finally {
        setRoleLoading(false);
      }
    },
    [permList],
  );

  useEffect(() => {
    hydrateRole(activeRole);
  }, [activeRole, hydrateRole]);

  function togglePerm(_roleId, module, action) {
    const p = findPerm(module, action);
    if (!p?.id) return;
    setGrantIds((prev) => {
      const next = new Set(prev);
      const id = String(p.id);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    setDirty(true);
  }

  async function saveRoleChanges() {
    if (!activeRole) return;
    const ids = [...grantIds];
    const policyIds = rolePolicies.map((p) => String(p.id || p.uuid)).filter(Boolean);
    try {
      await iamService.updateRole(activeRole, {
        permissions: ids,
        policies: policyIds,
      });
      await hydrateRole(activeRole);
      reload();
      toast.success("Role updated");
    } catch (err) {
      if (err?.response?.status === 403) toast.error("You cannot edit this role.");
      else toast.error(err?.friendlyMessage || "Could not save role.");
    }
  }

  async function handleDelete(role) {
    if (!role.isDeletable) {
      toast.warning(`Cannot delete ${role.type || "this"} role.`);
      return;
    }
    if (!window.confirm(`Delete role "${role.name}"?`)) return;
    try {
      await iamService.deleteRole(role.id);
      toast.success("Role deleted");
      if (activeRole === role.id) setActiveRole(null);
      reload();
    } catch (err) {
      toast.error(err?.friendlyMessage || "Could not delete role.");
    }
  }

  async function handleBulkDelete() {
    if (!selectedRoleIds.size) return;
    if (!window.confirm(`Delete ${selectedRoleIds.size} role(s)?`)) return;
    setBulkBusy(true);
    try {
      await iamService.bulkDeleteRoles([...selectedRoleIds]);
      toast.success("Roles deleted");
      setSelectedRoleIds(new Set());
      if ([...selectedRoleIds].includes(activeRole)) setActiveRole(null);
      reload();
    } catch (err) {
      toast.error(err?.friendlyMessage || "Bulk delete failed.");
    } finally {
      setBulkBusy(false);
    }
  }

  async function handleExport() {
    try {
      const selections = [...selectedRoleIds].length ? [...selectedRoleIds] : roles.map((r) => r.id);
      await iamService.exportRoles({ selections });
      toast.success("Export started");
    } catch (err) {
      toast.error(err?.friendlyMessage || "Export failed.");
    }
  }

  async function openViewPermissions(role) {
    try {
      const raw = await iamService.getRole(role.id);
      setViewPermsRole(mapRole(raw));
    } catch (err) {
      toast.error(err?.friendlyMessage || "Could not load role.");
    }
  }

  const active = roles.find((r) => r.id === activeRole);
  const canEditActive = active?.isMutable && ability.canUpdateRole;
  const hasChanges = dirty || policiesDirty;

  return (
    <div data-testid="roles-list-page">
      <PageHeader
        breadcrumbs={[{ label: "IAM", to: "/iam" }, { label: "Roles" }]}
        overline="Identity & Access"
        title="Roles"
        description={
          loading ? "Loading roles…" : `${meta.total} roles · ${permsMapped.length} permissions in catalog`
        }
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            <Button variant="outline" size="sm" onClick={() => reload()} className="h-9" data-testid="roles-refresh">
              <RefreshCw className="h-3.5 w-3.5" />
            </Button>
            {ability.canExportRole && (
              <Button variant="outline" size="sm" onClick={handleExport} className="h-9" data-testid="roles-export">
                <Download className="h-3.5 w-3.5 mr-1" /> Export
              </Button>
            )}
            {ability.canDeleteRole && selectedRoleIds.size > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleBulkDelete}
                disabled={bulkBusy}
                className="h-9 text-red-600 border-red-200"
                data-testid="roles-bulk-delete"
              >
                <Trash2 className="h-3.5 w-3.5 mr-1" /> Delete ({selectedRoleIds.size})
              </Button>
            )}
            {ability.canCreateRole && (
              <Button
                onClick={() => setCreateOpen(true)}
                className="bg-[#0066FF] hover:bg-[#0040CC] text-white h-10 rounded-lg"
                data-testid="roles-new-button"
              >
                <Plus className="h-4 w-4 mr-1.5" /> Create role
              </Button>
            )}
          </div>
        }
      />

      <div className="px-6 pb-3 flex flex-wrap items-center gap-2">
        <div className="relative w-full max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#4B5563]" />
          <Input
            value={searchDraft}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Search roles…"
            className="pl-9 h-9 text-sm"
            data-testid="roles-search"
          />
        </div>
        <Select
          value={queryState.service || "all"}
          onValueChange={(v) => patchQuery({ service: v === "all" ? "" : v, page: 1 })}
        >
          <SelectTrigger className="h-9 w-[160px] text-xs" data-testid="roles-filter-service">
            <SelectValue placeholder="Service" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All services</SelectItem>
            {services.map((s) => (
              <SelectItem key={String(s)} value={String(s)}>
                {String(s)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={queryState.type || "all"}
          onValueChange={(v) => patchQuery({ type: v === "all" ? "" : v, page: 1 })}
        >
          <SelectTrigger className="h-9 w-[180px] text-xs" data-testid="roles-filter-type">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            {IAM_SCHEME_TYPES.map((t) => (
              <SelectItem key={t.id} value={t.id}>
                {t.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="p-6 pt-0 grid grid-cols-1 xl:grid-cols-[300px_1fr] gap-4">
        <div className="bg-white border border-black/[0.08] rounded-md overflow-hidden flex flex-col max-h-[calc(100vh-220px)]">
          <div className="px-4 py-2.5 border-b border-black/[0.08] overline shrink-0">Roles</div>
          <div className="divide-y divide-black/[0.08] overflow-y-auto flex-1">
            {loading && <div className="p-4 text-sm text-[#4B5563]">Loading…</div>}
            {!loading && roles.length === 0 && (
              <div className="p-4 text-sm text-[#4B5563]" data-testid="roles-empty">
                No roles match filters.
              </div>
            )}
            {roles.map((r) => (
              <div
                key={r.id}
                className={`flex items-start gap-1 border-l-2 ${
                  activeRole === r.id ? "bg-[#0066FF]/10 border-[#0066FF]" : "border-transparent hover:bg-[#F1F2F5]"
                }`}
              >
                {ability.canDeleteRole && r.isDeletable && (
                  <input
                    type="checkbox"
                    className="mt-4 ml-2 shrink-0"
                    checked={selectedRoleIds.has(String(r.id))}
                    onChange={(e) => {
                      const next = new Set(selectedRoleIds);
                      if (e.target.checked) next.add(String(r.id));
                      else next.delete(String(r.id));
                      setSelectedRoleIds(next);
                    }}
                    data-testid={`role-select-${r.id}`}
                  />
                )}
                <button
                  type="button"
                  onClick={() => setActiveRole(r.id)}
                  data-testid={`role-item-${r.id}`}
                  className="flex-1 text-left px-4 py-3 min-w-0"
                >
                  <div className="font-medium text-sm flex items-center gap-2">
                    {r.name}
                    {!r.isMutable && <Lock className="h-3 w-3 text-[#4B5563]" title="FLB managed" />}
                  </div>
                  <div className="text-xs text-[#4B5563] mt-0.5 line-clamp-1">{r.description || r.service || "—"}</div>
                  <div className="text-[10px] font-mono text-[#6B7280] mt-1 flex gap-2">
                    <span>{schemeTypeLabel(r.schemeType || r.type)}</span>
                    {r.service && <span>{r.service}</span>}
                  </div>
                </button>
                <RoleListItemActions
                  role={r}
                  onEdit={(role) => setEditRoleId(role.id)}
                  onViewPermissions={openViewPermissions}
                  onDelete={handleDelete}
                />
              </div>
            ))}
          </div>
          {meta.lastPage > 1 && (
            <div className="px-3 py-2 border-t border-black/[0.08] flex items-center justify-between text-xs font-mono text-[#4B5563]">
              <button
                type="button"
                disabled={meta.page <= 1}
                onClick={() => patchQuery({ page: meta.page - 1 })}
                className="disabled:opacity-40"
              >
                Prev
              </button>
              <span>
                {meta.page} / {meta.lastPage}
              </span>
              <button
                type="button"
                disabled={meta.page >= meta.lastPage}
                onClick={() => patchQuery({ page: meta.page + 1 })}
                className="disabled:opacity-40"
              >
                Next
              </button>
            </div>
          )}
        </div>

        <div className="bg-white border border-black/[0.08] rounded-md overflow-hidden">
          <div className="px-4 py-3 border-b border-black/[0.08] flex items-center justify-between gap-3 flex-wrap">
            <div>
              <div className="overline">Permission matrix</div>
              <div className="font-display font-bold text-lg tracking-tight mt-0.5">{active?.name || "—"}</div>
              {roleLoading && <div className="text-xs text-[#4B5563] mt-1">Loading…</div>}
            </div>
            <Button
              onClick={saveRoleChanges}
              disabled={!hasChanges || !activeRole || roleLoading || !canEditActive}
              className="bg-[#0066FF] hover:bg-[#0040CC] text-white disabled:opacity-50 h-8 text-xs rounded-md"
              data-testid="role-save"
            >
              {!hasChanges ? "Saved" : "Save role"}
            </Button>
          </div>
          {!active?.isMutable && active && (
            <div className="px-4 py-2 text-xs text-amber-800 bg-amber-500/10 border-b border-amber-500/20 flex items-center justify-between gap-2">
              <span>FLB managed roles are read-only. View permissions or duplicate policies via attached policies on org roles.</span>
              <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => openViewPermissions(active)}>
                View permissions
              </Button>
            </div>
          )}
          {canEditActive && (
            <div className="px-4 py-3 border-b border-black/[0.08]">
              <div className="overline text-[10px] mb-2">Attached policies</div>
              <PolicyAttacher
                available={policyCatalog}
                value={rolePolicies}
                onChange={(next) => {
                  setRolePolicies(next);
                  setPoliciesDirty(true);
                }}
              />
            </div>
          )}
          {!permsMapped.length ? (
            <div className="p-6 text-sm text-[#4B5563]">No permission catalog loaded.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-white/60">
                  <tr>
                    <th className="text-left px-4 py-2.5 text-[10px] uppercase tracking-wider font-semibold text-[#4B5563] border-b border-black/[0.08] sticky left-0 bg-white">
                      Module
                    </th>
                    {tableActions.map((a) => (
                      <th
                        key={a}
                        className="text-center px-3 py-2.5 text-[10px] uppercase tracking-wider font-semibold text-[#4B5563] border-b border-black/[0.08]"
                      >
                        {a}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {modules.map((mod) => (
                    <tr key={mod} className="border-b border-black/[0.08]/60">
                      <td className="px-4 py-3 text-sm font-medium sticky left-0 bg-white">{mod}</td>
                      {tableActions.map((a) => {
                        const p = findPerm(mod, a);
                        const granted = p?.id && grantIds.has(String(p.id));
                        const supported = Boolean(p);
                        return (
                          <td key={`${mod}-${a}`} className="px-3 py-3 text-center">
                            {!supported ? (
                              <Minus className="h-3 w-3 text-[#1F2937] mx-auto" />
                            ) : (
                              <button
                                type="button"
                                disabled={!canEditActive}
                                onClick={() => togglePerm(activeRole, mod, a)}
                                className={`h-5 w-5 mx-auto grid place-items-center rounded-sm border ${
                                  granted
                                    ? "bg-emerald-500/10 border-emerald-500/40"
                                    : "border-black/[0.08]"
                                } disabled:opacity-40`}
                                data-testid={`perm-toggle-${activeRole}-${mod}-${a}`}
                              >
                                {granted && <Check className="h-3 w-3 text-[#15803D]" strokeWidth={2.5} />}
                              </button>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <RoleFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        mode="create"
        onSaved={(row) => {
          reload();
          if (row?.id) setActiveRole(row.id);
        }}
      />
      <RoleFormDialog
        open={Boolean(editRoleId)}
        onOpenChange={(v) => !v && setEditRoleId(null)}
        mode="edit"
        roleId={editRoleId}
        permissionIds={[...grantIds]}
        onSaved={() => {
          setEditRoleId(null);
          reload();
          hydrateRole(activeRole);
        }}
      />
      <ViewRolePermissionsDialog
        open={Boolean(viewPermsRole)}
        onOpenChange={(v) => !v && setViewPermsRole(null)}
        role={viewPermsRole}
      />
    </div>
  );
}

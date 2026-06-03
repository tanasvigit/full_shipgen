import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import PageHeader from "@/components/common/PageHeader";
import PolicyFormDialog from "@/components/iam/policies/PolicyFormDialog";
import PolicyListItemActions from "@/components/iam/policies/PolicyListItemActions";
import ViewPolicyPermissionsDialog from "@/components/iam/policies/ViewPolicyPermissionsDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Lock, Check, Minus, Download, RefreshCw, Search, FileKey, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { iamService } from "@/services/iam";
import { mapPermission, mapPolicy } from "@/lib/mappers";
import { usePoliciesListPage } from "@/hooks/iam/usePoliciesListPage";
import { useIamAbility } from "@/hooks/iam/useIamAbility";
import { IAM_SCHEME_TYPES, schemeTypeLabel } from "@/lib/iam/schemeTypes";
import {
  buildPermissionMatrixActions,
  buildPermissionMatrixModules,
  findMatrixPermission,
  resolveGrantedPermissionIds,
} from "@/lib/iam/permissionMatrix";

export default function PoliciesList() {
  const ability = useIamAbility();
  const { queryState, patchQuery, policies, loading, meta, reload } = usePoliciesListPage();

  const [services, setServices] = useState([]);
  const [permList, setPermList] = useState([]);
  const [activePolicy, setActivePolicy] = useState(null);
  const [grantIds, setGrantIds] = useState(() => new Set());
  const [dirty, setDirty] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [editPolicyId, setEditPolicyId] = useState(null);
  const [viewPermsPolicy, setViewPermsPolicy] = useState(null);
  const [policyLoading, setPolicyLoading] = useState(false);
  const [searchDraft, setSearchDraft] = useState(queryState.query);
  const [selectedPolicyIds, setSelectedPolicyIds] = useState(() => new Set());
  const [bulkBusy, setBulkBusy] = useState(false);
  const searchDebounceRef = useRef(null);

  const permsMapped = useMemo(() => permList.map((p) => mapPermission(p)), [permList]);
  const modules = useMemo(() => buildPermissionMatrixModules(permsMapped), [permsMapped]);
  const tableActions = useMemo(() => buildPermissionMatrixActions(permsMapped), [permsMapped]);

  useEffect(() => {
    setSearchDraft(queryState.query);
  }, [queryState.query]);

  useEffect(() => {
    iamService.getAuthServices().then(setServices).catch(() => setServices([]));
    iamService
      .listPermissions()
      .then(setPermList)
      .catch(() => setPermList([]));
  }, []);

  useEffect(() => {
    if (!loading && policies.length && !policies.some((p) => p.id === activePolicy)) {
      setActivePolicy(policies[0]?.id || null);
    }
    if (!loading && !policies.length) setActivePolicy(null);
  }, [loading, policies, activePolicy]);

  const handleSearchChange = useCallback(
    (value) => {
      setSearchDraft(value);
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
      searchDebounceRef.current = setTimeout(() => patchQuery({ query: value, page: 1 }), 250);
    },
    [patchQuery],
  );

  const hydratePolicy = useCallback(
    async (policyId) => {
      if (!policyId) {
        setGrantIds(new Set());
        setDirty(false);
        return;
      }
      setPolicyLoading(true);
      try {
        const raw = await iamService.getPolicy(policyId);
        setGrantIds(resolveGrantedPermissionIds(raw, permList));
        setDirty(false);
      } catch (err) {
        if (err?.response?.status === 403) toast.error("You cannot view this policy.");
        else toast.error(err?.friendlyMessage || "Could not load policy.");
        setGrantIds(new Set());
      } finally {
        setPolicyLoading(false);
      }
    },
    [permList],
  );

  useEffect(() => {
    hydratePolicy(activePolicy);
  }, [activePolicy, hydratePolicy]);

  function togglePerm(_policyId, module, action) {
    const p = findMatrixPermission(permsMapped, module, action);
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

  async function savePolicyPermissions() {
    if (!activePolicy) return;
    try {
      await iamService.updatePolicy(activePolicy, { permissions: [...grantIds] });
      await hydratePolicy(activePolicy);
      reload();
      toast.success("Policy permissions updated");
    } catch (err) {
      if (err?.response?.status === 403) toast.error("You cannot edit this policy.");
      else toast.error(err?.friendlyMessage || "Could not save policy.");
    }
  }

  async function handleDelete(policy) {
    if (!policy.isDeletable) {
      toast.warning(`Cannot delete ${policy.type || "this"} policy.`);
      return;
    }
    if (!window.confirm(`Delete policy "${policy.name}"?`)) return;
    try {
      await iamService.deletePolicy(policy.id);
      toast.success("Policy deleted");
      if (activePolicy === policy.id) setActivePolicy(null);
      reload();
    } catch (err) {
      toast.error(err?.friendlyMessage || "Could not delete policy.");
    }
  }

  async function handleBulkDelete() {
    if (!selectedPolicyIds.size) return;
    if (!window.confirm(`Delete ${selectedPolicyIds.size} policy/policies?`)) return;
    setBulkBusy(true);
    try {
      await iamService.bulkDeletePolicies([...selectedPolicyIds]);
      toast.success("Policies deleted");
      setSelectedPolicyIds(new Set());
      if ([...selectedPolicyIds].includes(activePolicy)) setActivePolicy(null);
      reload();
    } catch (err) {
      toast.error(err?.friendlyMessage || "Bulk delete failed.");
    } finally {
      setBulkBusy(false);
    }
  }

  async function handleExport() {
    try {
      const selections = [...selectedPolicyIds].length ? [...selectedPolicyIds] : policies.map((p) => p.id);
      await iamService.exportPolicies({ selections });
      toast.success("Export started");
    } catch (err) {
      toast.error(err?.friendlyMessage || "Export is not available on this API build.");
    }
  }

  async function openViewPermissions(policy) {
    try {
      const raw = await iamService.getPolicy(policy.id);
      setViewPermsPolicy(mapPolicy(raw));
    } catch (err) {
      toast.error(err?.friendlyMessage || "Could not load policy.");
    }
  }

  const active = policies.find((p) => p.id === activePolicy);
  const canEditActive = active?.isMutable && ability.canUpdatePolicy;

  return (
    <div data-testid="policies-list-page">
      <PageHeader
        breadcrumbs={[{ label: "IAM", to: "/iam" }, { label: "Policies" }]}
        overline="Identity & Access"
        title="Policies"
        description={
          loading ? "Loading policies…" : `${meta.total} policies · ${permsMapped.length} permissions in catalog`
        }
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            <Button variant="outline" size="sm" onClick={() => reload()} className="h-9" data-testid="policies-refresh">
              <RefreshCw className="h-3.5 w-3.5" />
            </Button>
            {ability.canExportPolicy && (
              <Button variant="outline" size="sm" onClick={handleExport} className="h-9" data-testid="policies-export">
                <Download className="h-3.5 w-3.5 mr-1" /> Export
              </Button>
            )}
            {ability.canDeletePolicy && selectedPolicyIds.size > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleBulkDelete}
                disabled={bulkBusy}
                className="h-9 text-red-600 border-red-200"
                data-testid="policies-bulk-delete"
              >
                <Trash2 className="h-3.5 w-3.5 mr-1" /> Delete ({selectedPolicyIds.size})
              </Button>
            )}
            {ability.canCreatePolicy && (
              <Button
                onClick={() => setCreateOpen(true)}
                className="bg-[#0066FF] hover:bg-[#0040CC] text-white h-10 rounded-lg"
                data-testid="policies-new-button"
              >
                <Plus className="h-4 w-4 mr-1.5" /> Create policy
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
            placeholder="Search policies…"
            className="pl-9 h-9 text-sm"
            data-testid="policies-search"
          />
        </div>
        <Select
          value={queryState.service || "all"}
          onValueChange={(v) => patchQuery({ service: v === "all" ? "" : v, page: 1 })}
        >
          <SelectTrigger className="h-9 w-[160px] text-xs" data-testid="policies-filter-service">
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
          <SelectTrigger className="h-9 w-[180px] text-xs" data-testid="policies-filter-type">
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
          <div className="px-4 py-2.5 border-b border-black/[0.08] overline shrink-0">Policies</div>
          <div className="divide-y divide-black/[0.08] overflow-y-auto flex-1">
            {loading && <div className="p-4 text-sm text-[#4B5563]">Loading…</div>}
            {!loading && policies.length === 0 && (
              <div className="p-4 text-sm text-[#4B5563]" data-testid="policies-empty">
                No policies match filters.
              </div>
            )}
            {policies.map((p) => (
              <div
                key={p.id}
                className={`flex items-start gap-1 border-l-2 ${
                  activePolicy === p.id ? "bg-[#0066FF]/10 border-[#0066FF]" : "border-transparent hover:bg-[#F1F2F5]"
                }`}
              >
                {ability.canDeletePolicy && p.isDeletable && (
                  <input
                    type="checkbox"
                    className="mt-4 ml-2 shrink-0"
                    checked={selectedPolicyIds.has(String(p.id))}
                    onChange={(e) => {
                      const next = new Set(selectedPolicyIds);
                      if (e.target.checked) next.add(String(p.id));
                      else next.delete(String(p.id));
                      setSelectedPolicyIds(next);
                    }}
                    data-testid={`policy-select-${p.id}`}
                  />
                )}
                <button
                  type="button"
                  onClick={() => {
                    if (!p.isMutable) openViewPermissions(p);
                    else setActivePolicy(p.id);
                  }}
                  data-testid={`policy-item-${p.id}`}
                  className="flex-1 text-left px-4 py-3 min-w-0"
                >
                  <div className="font-medium text-sm flex items-center gap-2">
                    <FileKey className="h-3.5 w-3.5 text-[#4B5563] shrink-0" />
                    {p.name}
                    {!p.isMutable && <Lock className="h-3 w-3 text-[#4B5563]" title="FLB managed" />}
                  </div>
                  <div className="text-xs text-[#4B5563] mt-0.5 line-clamp-1">{p.description || "—"}</div>
                  <div className="text-[10px] font-mono text-[#6B7280] mt-1 flex gap-2">
                    <span>{schemeTypeLabel(p.schemeType || p.type)}</span>
                    {p.service && <span>{p.service}</span>}
                  </div>
                </button>
                <PolicyListItemActions
                  policy={p}
                  onEdit={(pol) => setEditPolicyId(pol.id)}
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
              {policyLoading && <div className="text-xs text-[#4B5563] mt-1">Loading…</div>}
            </div>
            <Button
              onClick={savePolicyPermissions}
              disabled={!dirty || !activePolicy || policyLoading || !canEditActive}
              className="bg-[#0066FF] hover:bg-[#0040CC] text-white disabled:opacity-50 h-8 text-xs rounded-md"
              data-testid="policy-save"
            >
              {!dirty ? "Saved" : "Save permissions"}
            </Button>
          </div>
          {!active?.isMutable && active && (
            <div className="px-4 py-2 text-xs text-amber-800 bg-amber-500/10 border-b border-amber-500/20 flex items-center justify-between gap-2">
              <span>FLB managed policies are read-only.</span>
              <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => openViewPermissions(active)}>
                View permissions
              </Button>
            </div>
          )}
          {!active ? (
            <div className="p-6 text-sm text-[#4B5563]">Select an organization-managed policy to edit permissions.</div>
          ) : !permsMapped.length ? (
            <div className="p-6 text-sm text-[#4B5563]">No permission catalog loaded.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm" data-testid="policy-permission-matrix">
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
                        const p = findMatrixPermission(permsMapped, mod, a);
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
                                onClick={() => togglePerm(activePolicy, mod, a)}
                                className={`h-5 w-5 mx-auto grid place-items-center rounded-sm border ${
                                  granted
                                    ? "bg-emerald-500/10 border-emerald-500/40"
                                    : "border-black/[0.08]"
                                } disabled:opacity-40`}
                                data-testid={`policy-perm-toggle-${activePolicy}-${mod}-${a}`}
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

      <PolicyFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        mode="create"
        permissionIds={[]}
        onSaved={(row) => {
          reload();
          if (row?.id) setActivePolicy(row.id);
        }}
      />
      <PolicyFormDialog
        open={Boolean(editPolicyId)}
        onOpenChange={(v) => !v && setEditPolicyId(null)}
        mode="edit"
        policyId={editPolicyId}
        permissionIds={[...grantIds]}
        onSaved={() => {
          setEditPolicyId(null);
          reload();
          hydratePolicy(activePolicy);
        }}
      />
      <ViewPolicyPermissionsDialog
        open={Boolean(viewPermsPolicy)}
        onOpenChange={(v) => !v && setViewPermsPolicy(null)}
        policy={viewPermsPolicy}
      />
    </div>
  );
}

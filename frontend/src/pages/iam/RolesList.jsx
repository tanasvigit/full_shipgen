import { useCallback, useEffect, useMemo, useState } from "react";
import PageHeader from "@/components/common/PageHeader";
import QuickCreateDialog from "@/components/common/QuickCreateDialog";
import { Button } from "@/components/ui/button";
import { Plus, Lock, Check, Minus, KeyRound } from "lucide-react";
import { toast } from "sonner";
import { iamService } from "@/services/iam";
import { mapPermission, mapRole } from "@/lib/mappers";

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
  const [roles, setRoles] = useState([]);
  const [permList, setPermList] = useState([]);
  const [activeRole, setActiveRole] = useState(null);
  const [grantIds, setGrantIds] = useState(() => new Set());
  const [dirty, setDirty] = useState(false);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [roleLoading, setRoleLoading] = useState(false);

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

  const loadRoles = useCallback(async () => {
    setLoading(true);
    try {
      const raw = await iamService.listRoles();
      const rows = raw.map(mapRole);
      setRoles(rows);
      setActiveRole((prev) => {
        if (prev && rows.some((r) => r.id === prev)) return prev;
        return rows[0]?.id || null;
      });
    } catch (err) {
      toast.error(err?.friendlyMessage || "Could not load roles.");
      setRoles([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadPermissions = useCallback(async () => {
    try {
      const raw = await iamService.listPermissions();
      setPermList(raw || []);
    } catch (err) {
      toast.error(err?.friendlyMessage || "Could not load permissions.");
      setPermList([]);
    }
  }, []);

  useEffect(() => {
    loadRoles();
    loadPermissions();
  }, [loadRoles, loadPermissions]);

  const hydrateRole = useCallback(
    async (roleId) => {
      if (!roleId) {
        setGrantIds(new Set());
        setDirty(false);
        return;
      }
      setRoleLoading(true);
      try {
        const raw = await iamService.getRole(roleId);
        const s = resolveGrantedIds(raw, permList);
        setGrantIds(s);
        setDirty(false);
      } catch (err) {
        if (err?.response?.status === 403) toast.error("You cannot view this role’s permissions.");
        else toast.error(err?.friendlyMessage || "Could not load role details.");
        setGrantIds(new Set());
      } finally {
        setRoleLoading(false);
      }
    },
    [permList],
  );

  useEffect(() => {
    hydrateRole(activeRole);
  }, [activeRole, hydrateRole, permList]);

  function togglePerm(roleIdIgnored, module, action) {
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

  async function savePerms() {
    if (!activeRole) return;
    const ids = [...grantIds];
    try {
      await iamService.updateRole(activeRole, {
        permissions: ids,
        permission_ids: ids,
      });
      await hydrateRole(activeRole);
      await loadRoles();
      toast.success("Permissions updated");
    } catch (err) {
      if (err?.response?.status === 403) toast.error("You cannot edit this role.");
      else toast.error(err?.friendlyMessage || "Could not save permissions.");
    }
  }

  async function handleCreate(v) {
    try {
      const created = await iamService.createRole({
        name: v.name,
        description: v.description || undefined,
      });
      const row = mapRole(created);
      if (v.template === "viewer") {
        const viewIds = permsMapped.filter((p) => actionFromSlug(p.slug) === "view").map((p) => String(p.id));
        if (viewIds.length && row.id) {
          try {
            await iamService.updateRole(row.id, { permissions: viewIds, permission_ids: viewIds });
          } catch {
            /* role created; viewer preset may not match backend envelope */
          }
        }
      }
      await loadRoles();
      setActiveRole(row.id);
      return { toast: `Role "${v.name}" created` };
    } catch (err) {
      throw new Error(err?.friendlyMessage || "Could not create role.");
    }
  }

  const active = roles.find((r) => r.id === activeRole);

  return (
    <div data-testid="roles-list-page">
      <PageHeader
        breadcrumbs={[{ label: "IAM", to: "/iam" }, { label: "Roles" }]}
        overline="Identity & Access"
        title="Roles"
        description={
          loading ? "Loading roles…" : `${roles.length} roles · ${permsMapped.length} permissions from API`
        }
        actions={
          <Button
            onClick={() => setOpen(true)}
            className="bg-[#0066FF] hover:bg-[#0040CC] text-white h-10 rounded-lg shadow-[0_10px_28px_-8px_rgba(0,102,255,0.45)]"
            data-testid="roles-new-button"
          >
            <Plus className="h-4 w-4 mr-1.5" /> Create role
          </Button>
        }
      />
      <div className="p-6 grid grid-cols-1 xl:grid-cols-[280px_1fr] gap-4">
        <div className="bg-white border border-black/[0.08] rounded-md overflow-hidden h-fit">
          <div className="px-4 py-2.5 border-b border-black/[0.08] overline">All roles</div>
          <div className="divide-y divide-black/[0.08]">
            {!loading && roles.length === 0 && <div className="p-4 text-sm text-[#4B5563]">No roles returned.</div>}
            {roles.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => setActiveRole(r.id)}
                data-testid={`role-item-${r.id}`}
                className={`w-full text-left px-4 py-3 transition-colors flex items-start gap-3 border-l-2 ${
                  activeRole === r.id ? "bg-[#0066FF]/10 border-[#0066FF]" : "hover:bg-[#F1F2F5] border-transparent"
                }`}
              >
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm flex items-center gap-2">
                    {r.name}
                    {r.system && <Lock className="h-3 w-3 text-[#4B5563]" title="System role" />}
                  </div>
                  <div className="text-xs text-[#4B5563] mt-0.5 line-clamp-2">{r.description}</div>
                </div>
                <span className="font-mono text-[10px] text-[#4B5563]">{r.users}u</span>
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white border border-black/[0.08] rounded-md overflow-hidden">
          <div className="px-4 py-3 border-b border-black/[0.08] flex items-center justify-between gap-3 flex-wrap">
            <div>
              <div className="overline">Permission matrix</div>
              <div className="font-display font-bold text-lg tracking-tight mt-0.5">{active?.name || "—"}</div>
              {roleLoading && <div className="text-xs text-[#4B5563] mt-1">Loading permissions…</div>}
            </div>
            <Button
              onClick={savePerms}
              disabled={!dirty || !activeRole || roleLoading || active?.system}
              className="bg-[#0066FF] hover:bg-[#0040CC] text-white disabled:opacity-50 h-8 text-xs rounded-md"
              data-testid="role-save"
            >
              {!dirty ? "Saved" : "Save permissions"}
            </Button>
          </div>
          {active?.system && (
            <div className="px-4 py-2 text-xs text-amber-800 bg-amber-500/10 border-b border-amber-500/20">
              System roles may be read-only in Fleetbase. Save may be rejected by the API.
            </div>
          )}
          {!permsMapped.length ? (
            <div className="p-6 text-sm text-[#4B5563]">No permission catalog loaded — check `/permissions`.</div>
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
                        className="text-center px-3 py-2.5 text-[10px] uppercase tracking-wider font-semibold text-[#4B5563] border-b border-black/[0.08] whitespace-nowrap"
                      >
                        {a}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {modules.map((mod) => (
                    <tr key={mod} className="border-b border-black/[0.08]/60">
                      <td className="px-4 py-3 text-sm font-medium text-[#0A0E1A] whitespace-nowrap sticky left-0 bg-white">
                        {mod}
                      </td>
                      {tableActions.map((a) => {
                        const p = findPerm(mod, a);
                        const granted = p?.id && grantIds.has(String(p.id));
                        const supported = Boolean(p);
                        return (
                          <td key={`${mod}-${a}`} className="px-3 py-3 text-center" data-testid={`perm-${activeRole}-${mod}-${a}`}>
                            {!supported ? (
                              <Minus className="h-3 w-3 text-[#1F2937] mx-auto" />
                            ) : (
                              <button
                                type="button"
                                onClick={() => togglePerm(activeRole, mod, a)}
                                aria-pressed={granted}
                                aria-label={`Toggle ${a} for ${mod}`}
                                className={`h-5 w-5 mx-auto grid place-items-center rounded-sm border transition-colors ${
                                  granted
                                    ? "bg-emerald-500/10 border-emerald-500/40 hover:bg-emerald-500/20"
                                    : "border-black/[0.08] hover:border-black/[0.18] hover:bg-[#F1F2F5]"
                                }`}
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
      <QuickCreateDialog
        open={open}
        onOpenChange={setOpen}
        title="Create role"
        description="Define a new role. Permissions use the catalog returned by the API."
        icon={KeyRound}
        submitLabel="Create role"
        testid="create-role-dialog"
        fields={[
          { key: "name", label: "Role name", placeholder: "Dispatch Coordinator", required: true },
          {
            key: "template",
            label: "Starting permissions",
            type: "select",
            options: [
              { value: "empty", label: "Empty — start from scratch" },
              { value: "viewer", label: "Viewer — grant all `view` permissions (best effort)" },
            ],
          },
          { key: "description", label: "Description", type: "textarea", placeholder: "What this role can do." },
        ]}
        onSubmit={handleCreate}
      />
    </div>
  );
}

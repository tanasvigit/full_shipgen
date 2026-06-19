import React, { useMemo, useState } from "react";
import { CheckCircle2, Grid3x3, Shield, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import {
  ACTION_CATALOG,
  getRoleMatrixValue,
  MODULE_CATALOG,
} from "../constants/adminRoleCatalog";
import { listAdminPermissions, listAdminRoles, updateAdminRole } from "../services/adminApi";

const ACCESS_STYLE = {
  "Full Access": "bg-emerald-50 text-emerald-700",
  "View Only": "bg-amber-50 text-amber-700",
  "No Access": "bg-slate-100 text-slate-600",
};

export default function RoleManagement() {
  const [roles, setRoles] = useState([]);
  const [permissionCatalog, setPermissionCatalog] = useState([]);
  const [activeRoleCode, setActiveRoleCode] = useState("");
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [roleRows, permissions] = await Promise.all([listAdminRoles(), listAdminPermissions()]);
        setRoles(roleRows);
        setPermissionCatalog(permissions);
        setActiveRoleCode(roleRows[0]?.code || "");
      } catch (e) {
        toast.error(e.message || "Failed to load roles");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const activeRole = roles.find((r) => r.code === activeRoleCode) || null;
  const activePermissions = new Set(activeRole?.permissions || []);

  const roleCards = useMemo(
    () =>
      roles.map((role) => ({
        code: role.code,
        label: role.label,
        permissionsCount: (role.permissions || []).length,
      })),
    [roles]
  );

  const saveRole = async (nextRole, toastMessage = "Role access profile updated") => {
    try {
      const updated = await updateAdminRole(nextRole.id, {
        description: nextRole.description,
        permissions: nextRole.permissions,
      });
      setRoles((prev) => prev.map((r) => (r.code === updated.code ? updated : r)));
      toast.success(toastMessage);
    } catch (e) {
      toast.error(e.message || "Failed to save role");
    }
  };

  const upsertActivePermissions = (nextPermissions) => {
    if (!activeRole) return;
    saveRole({
      ...activeRole,
      permissions: Array.from(new Set(nextPermissions)).sort(),
    });
  };

  const toggleModule = (moduleKey, enabled) => {
    if (!activeRole) return;
    const module = MODULE_CATALOG.find((m) => m.key === moduleKey);
    if (!module) return;
    const next = new Set(activePermissions);
    if (enabled) {
      next.add(module.fullPermission);
      if (module.viewPermission) next.delete(module.viewPermission);
    } else {
      next.delete(module.fullPermission);
      if (module.viewPermission) next.delete(module.viewPermission);
    }
    upsertActivePermissions(Array.from(next));
  };

  const toggleAction = (actionKey, enabled) => {
    if (!activeRole) return;
    const action = ACTION_CATALOG.find((a) => a.key === actionKey);
    if (!action) return;
    const next = new Set(activePermissions);
    action.permissions.forEach((perm) => {
      if (enabled) next.add(perm);
      else next.delete(perm);
    });
    upsertActivePermissions(Array.from(next));
  };

  const updateDescription = (description) => {
    if (!activeRole) return;
    saveRole({ ...activeRole, description }, "Role description updated");
  };

  const matrixRoleState = useMemo(() => {
    const out = {};
    roles.forEach((role) => {
      out[role.code] = {
        modules: MODULE_CATALOG.reduce((acc, module) => {
          if (role.permissions.includes(module.fullPermission)) acc[module.key] = "full";
          else if (module.viewPermission && role.permissions.includes(module.viewPermission)) acc[module.key] = "view";
          else acc[module.key] = "none";
          return acc;
        }, {}),
      };
    });
    return out;
  }, [roles]);

  const moduleChecked = (module) =>
    activePermissions.has(module.fullPermission) ||
    (module.viewPermission && activePermissions.has(module.viewPermission));

  const actionChecked = (action) => action.permissions.some((p) => activePermissions.has(p));

  const knownPermissions = useMemo(
    () => new Set(permissionCatalog.map((p) => p.code)),
    [permissionCatalog]
  );

  const extraPermissions = useMemo(
    () => (activeRole?.permissions || []).filter((p) => !knownPermissions.has(p)),
    [activeRole?.permissions, knownPermissions]
  );

  const saveActiveRole = () => {
    if (!activeRole) return;
    saveRole(activeRole);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-5 py-6 sm:py-8">
      <div className="flex items-center gap-3 mb-4">
        <Shield className="w-6 h-6 text-slate-700" />
        <div>
          <h1 className="text-xl font-bold text-slate-900">Role Management</h1>
          <p className="text-sm text-slate-600">Business-friendly access governance for demos, operators, and administrators.</p>
        </div>
      </div>

      <Tabs defaultValue="roles">
        <TabsList className="mb-4">
          <TabsTrigger value="roles">Role Details</TabsTrigger>
          <TabsTrigger value="matrix">Access Matrix</TabsTrigger>
        </TabsList>

        <TabsContent value="roles">
          <div className="grid grid-cols-1 lg:grid-cols-[340px,1fr] gap-4">
            <div className="space-y-3">
              {loading && <div className="text-sm text-slate-500">Loading roles…</div>}
              {roleCards.map((role) => (
                <button
                  key={role.code}
                  type="button"
                  onClick={() => setActiveRoleCode(role.code)}
                  className={`w-full text-left border rounded-lg px-4 py-3 transition ${
                    activeRoleCode === role.code ? "border-slate-900 bg-slate-50" : "border-slate-200 bg-white hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="font-semibold text-slate-900">{role.label}</div>
                    <ShieldCheck className="w-4 h-4 text-slate-500" />
                  </div>
                  <div className="text-xs text-slate-500 mt-1">{role.permissionsCount} backend permissions mapped (hidden)</div>
                </button>
              ))}
            </div>

            <div className="bg-white border border-slate-200 rounded-lg p-4 sm:p-5 space-y-5">
              <div className="space-y-2">
                  <h2 className="text-lg font-bold text-slate-900">{activeRole?.label || "Select role"}</h2>
                <label className="block">
                  <span className="block text-xs font-semibold text-slate-600 mb-1">Description</span>
                  <textarea
                    rows={3}
                    value={activeRole?.description || ""}
                    onChange={(e) => updateDescription(e.target.value)}
                    className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
                  />
                </label>
              </div>

              <section>
                <h3 className="text-sm font-bold text-slate-800 mb-2">Modules Accessible</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {MODULE_CATALOG.map((module) => {
                    const checked = moduleChecked(module);
                    return (
                      <label key={module.key} className="flex items-center justify-between border border-slate-200 rounded-md px-3 py-2">
                        <span className="text-sm text-slate-700">{module.label}</span>
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(e) => toggleModule(module.key, e.target.checked)}
                          className="rounded border-slate-300"
                        />
                      </label>
                    );
                  })}
                </div>
              </section>

              <section>
                <h3 className="text-sm font-bold text-slate-800 mb-2">Actions Allowed</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {ACTION_CATALOG.map((action) => (
                    <label key={action.key} className="flex items-center justify-between border border-slate-200 rounded-md px-3 py-2">
                      <span className="text-sm text-slate-700">{action.label}</span>
                      <input
                        type="checkbox"
                        checked={actionChecked(action)}
                        onChange={(e) => toggleAction(action.key, e.target.checked)}
                        className="rounded border-slate-300"
                      />
                    </label>
                  ))}
                </div>
              </section>

              <div className="flex items-center justify-between text-xs text-slate-500 border-t border-slate-100 pt-3">
                <span>Underlying technical permission mapping stays hidden in UI.</span>
                <button
                  type="button"
                  onClick={saveActiveRole}
                  className="inline-flex items-center gap-1.5 rounded-md bg-slate-900 text-white px-3 py-1.5 font-semibold"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" /> Save Role Profile
                </button>
              </div>
              {extraPermissions.length > 0 && (
                <div className="text-xs text-slate-500 border-t border-slate-100 pt-3">
                  Additional permissions: {extraPermissions.join(", ")}
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="matrix">
          <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-100">
              <Grid3x3 className="w-4 h-4 text-slate-500" />
              <h3 className="text-sm font-semibold text-slate-800">Access Matrix</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1120px] text-sm">
                <thead className="bg-slate-50 text-left text-xs uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Role</th>
                    {MODULE_CATALOG.map((module) => (
                      <th key={module.key} className="px-4 py-3">{module.label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {roles.map((role) => (
                    <tr key={role.code} className="border-t border-slate-100">
                      <td className="px-4 py-3 font-semibold text-slate-800 whitespace-nowrap">{role.label}</td>
                      {MODULE_CATALOG.map((module) => {
                        const value = getRoleMatrixValue(matrixRoleState[role.code], module.key);
                        return (
                          <td key={`${role.code}-${module.key}`} className="px-4 py-3">
                            <span className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold ${ACCESS_STYLE[value]}`}>
                              {value}
                            </span>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

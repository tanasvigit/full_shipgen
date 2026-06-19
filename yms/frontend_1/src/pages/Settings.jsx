import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Settings as SettingsIcon, UserCog } from "lucide-react";
import { ROLE_LABELS, IMPERSONATABLE_ROLES } from "../services/authStorage";
import { useAuth } from "../contexts/AuthContext";
import { Button } from "../components/ui/button";
import { fetchAuthMe } from "../services/authApi";
import { hasPermission } from "../constants/permissions";
import { firstAccessiblePath } from "../constants/navigation";

export default function Settings() {
  const { isAdmin, impersonate, impersonating, role, roleLabels, logout } = useAuth();
  const devImpersonationEnabled =
    process.env.REACT_APP_ENABLE_DEV_ROLE_OVERRIDE === "true" &&
    process.env.NODE_ENV !== "production";

  const navigate = useNavigate();
  const [impersonateRole, setImpersonateRole] = useState("");
  const [status, setStatus] = useState("");

  const handleImpersonate = async () => {
    if (!impersonateRole) return;
    setStatus("");
    try {
      await impersonate(impersonateRole);
      const me = await fetchAuthMe();
      setStatus(`Now viewing as ${roleLabels[impersonateRole] || impersonateRole}`);
      navigate(firstAccessiblePath((m) => hasPermission(me.permissions, m)));
    } catch (err) {
      setStatus(err.message || "Impersonation failed");
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-5 py-8">
      <div className="flex items-center gap-3 mb-6">
        <SettingsIcon className="w-6 h-6 text-slate-700" />
        <h1 className="text-xl font-bold text-slate-900">System Settings</h1>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-4">
        <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Session</h2>
        <p className="text-sm text-slate-600">
          Signed in as <strong>{roleLabels[role] || role}</strong>
          {impersonating && <span className="text-amber-600 ml-2">(impersonating)</span>}
        </p>
        <Button variant="outline" data-testid="settings-logout" onClick={() => logout()}>
          Sign out
        </Button>
      </div>

      {isAdmin && devImpersonationEnabled && (
        <div className="bg-white border border-slate-200 rounded-lg p-5 mt-6 space-y-4" data-testid="developer-tools">
          <div className="flex items-center gap-2">
            <UserCog className="w-5 h-5 text-slate-600" />
            <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Developer Tools</h2>
          </div>
          <p className="text-sm text-slate-500">Impersonate a role to test navigation and permissions without separate accounts.</p>
          <div className="flex flex-wrap items-end gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Impersonate Role</label>
              <select
                data-testid="impersonate-role-select"
                value={impersonateRole}
                onChange={(e) => setImpersonateRole(e.target.value)}
                className="border border-slate-200 rounded-md px-3 py-2 text-sm min-w-[200px]"
              >
                <option value="">Select role…</option>
                {IMPERSONATABLE_ROLES.map((r) => (
                  <option key={r} value={r}>
                    {ROLE_LABELS[r] || r}
                  </option>
                ))}
              </select>
            </div>
            <Button
              data-testid="impersonate-submit"
              onClick={handleImpersonate}
              disabled={!impersonateRole}
              className="bg-amber-400 hover:bg-amber-300 text-slate-900"
            >
              Impersonate
            </Button>
          </div>
          {status && <p className="text-sm text-slate-600">{status}</p>}
        </div>
      )}
    </div>
  );
}

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { fetchAuthMe, impersonateRole, login as loginApi, logoutApi, refreshSession } from "../services/authApi";
import {
  clearTokens,
  getAccessToken,
  getRefreshToken,
  isImpersonating,
  setImpersonating,
  YMS_ROLES,
  IMPERSONATABLE_ROLES,
  ROLE_LABELS,
} from "../services/authStorage";
import { hasPermission, PERMS, MOD } from "../constants/permissions";
import { YARD_EMBEDDED } from "../constants/basePath";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [userId, setUserId] = useState(null);
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [role, setRole] = useState(null);
  const [permissions, setPermissions] = useState([]);
  const [ready, setReady] = useState(() => !(getAccessToken() || getRefreshToken()));
  const [authenticated, setAuthenticated] = useState(false);
  const [impersonating, setImpersonatingState] = useState(false);

  const applyMe = useCallback((me) => {
    setUserId(me.user_id);
    setUsername(me.username || "");
    setDisplayName(me.display_name || me.username || "");
    setRole(me.role);
    setPermissions(me.permissions || []);
    setImpersonatingState(Boolean(me.impersonating));
    setImpersonating(Boolean(me.impersonating));
    setAuthenticated(true);
  }, []);

  const refresh = useCallback(async () => {
    try {
      const me = await fetchAuthMe();
      applyMe(me);
    } catch {
      const refreshToken = getRefreshToken();
      if (refreshToken) {
        try {
          await refreshSession();
          const me = await fetchAuthMe();
          applyMe(me);
          return;
        } catch {
          clearTokens();
        }
      }
      setPermissions([]);
      setAuthenticated(false);
      setRole(null);
    } finally {
      setReady(true);
    }
  }, [applyMe]);

  useEffect(() => {
    if (getAccessToken() || getRefreshToken()) {
      refresh();
    } else {
      setReady(true);
    }
  }, [refresh]);

  const login = useCallback(
    async (user, password) => {
      clearTokens();
      await loginApi(user, password);
      setReady(false);
      await refresh();
    },
    [refresh]
  );

  const logout = useCallback(async () => {
    await logoutApi();
    setUserId(null);
    setUsername("");
    setDisplayName("");
    setRole(null);
    setPermissions([]);
    setAuthenticated(false);
    setImpersonatingState(false);
    setImpersonating(false);
    setReady(true);
    if (typeof window !== "undefined") {
      window.location.replace(YARD_EMBEDDED ? "/auth/login" : "/login");
    }
  }, []);

  const impersonate = useCallback(
    async (nextRole) => {
      if (!IMPERSONATABLE_ROLES.includes(nextRole)) return;
      await impersonateRole(nextRole);
      setReady(false);
      await refresh();
    },
    [refresh]
  );

  const can = useCallback(
    (permission) => hasPermission(permissions, permission),
    [permissions]
  );

  const value = useMemo(
    () => ({
      userId,
      username,
      displayName,
      role,
      permissions,
      ready,
      isAuthenticated: authenticated,
      impersonating: impersonating || isImpersonating(),
      roles: YMS_ROLES,
      impersonatableRoles: IMPERSONATABLE_ROLES,
      roleLabels: ROLE_LABELS,
      login,
      logout,
      impersonate,
      can,
      refresh,
      isAdmin: role === "yard_admin",
    }),
    [
      userId,
      username,
      displayName,
      role,
      permissions,
      ready,
      authenticated,
      impersonating,
      login,
      logout,
      impersonate,
      can,
      refresh,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};

export { PERMS, MOD };

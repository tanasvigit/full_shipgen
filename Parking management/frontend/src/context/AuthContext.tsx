import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { roleHasPermission } from '../config/permissions';
import type { Permission } from '../config/permissions';
import type { User, UserRole, AuthState } from '../types';
import * as authApi from '../api/auth';
import { ApiError } from '../api/client';

const AuthContext = createContext<AuthState | null>(null);

function toUserRole(role: string): UserRole {
  if (role === 'admin' || role === 'supervisor' || role === 'operator') {
    return role;
  }

  return 'operator';
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    let active = true;

    authApi
      .restoreSession()
      .then((session) => {
        if (!active || !session) {
          return;
        }

        setUser({ ...session, role: toUserRole(session.role) });
        setPermissions(session.permissions as Permission[]);
      })
      .finally(() => {
        if (active) {
          setIsInitializing(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    try {
      const session = await authApi.login(email, password);
      const nextUser: User = { ...session, role: toUserRole(session.role) };
      setUser(nextUser);
      setPermissions(session.permissions as Permission[]);
      return nextUser;
    } catch (error) {
      if (error instanceof ApiError) {
        return null;
      }

      throw error;
    }
  }, []);

  const reloadSession = useCallback(async () => {
    const session = await authApi.restoreSession();
    if (!session) {
      setUser(null);
      setPermissions([]);
      return;
    }
    setUser({ ...session, role: toUserRole(session.role) });
    setPermissions(session.permissions as Permission[]);
  }, []);

  const logout = useCallback(async () => {
    await authApi.logout();
    setUser(null);
    setPermissions([]);
  }, []);

  const switchRole = useCallback((_role: UserRole) => {
    // Demo-only role switching is disabled when using the API.
  }, []);

  const hasPermission = useCallback(
    (permission: Permission) => {
      if (permissions.length > 0) {
        return permissions.includes(permission);
      }

      if (!user) {
        return false;
      }

      return roleHasPermission(user.role, permission);
    },
    [permissions, user],
  );

  const value = useMemo<AuthState>(
    () => ({
      user,
      isAuthenticated: !!user,
      isInitializing,
      login,
      reloadSession,
      logout,
      switchRole,
      hasPermission,
    }),
    [user, isInitializing, login, reloadSession, logout, switchRole, hasPermission],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

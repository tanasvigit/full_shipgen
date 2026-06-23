import type { ReactNode } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getDashboardPath } from '../config/permissions';
import { parkingAuthPath, parkingPath } from '../constants/basePath';
import type { Permission } from '../config/permissions';
import type { UserRole } from '../types';

interface ProtectedRouteProps {
  allowedRoles?: UserRole[];
  permission?: Permission;
  children?: ReactNode;
}

export default function ProtectedRoute({ allowedRoles, permission, children }: ProtectedRouteProps) {
  const { user, isAuthenticated, isInitializing, hasPermission } = useAuth();

  if (isInitializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-500 text-sm">
        Loading...
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to={parkingAuthPath()} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to={parkingPath(getDashboardPath(user.role))} replace />;
  }

  if (permission && !hasPermission(permission)) {
    return <Navigate to={parkingPath(getDashboardPath(user.role))} replace />;
  }

  if (children) {
    return <>{children}</>;
  }

  return <Outlet />;
}

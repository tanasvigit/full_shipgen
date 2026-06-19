import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { resolveRouteModule } from "../../constants/navigation";
import { getAccessToken, getRefreshToken } from "../../services/authStorage";

export function ProtectedRoute({ children, module: moduleOverride }) {
  const { isAuthenticated, ready, can } = useAuth();
  const location = useLocation();
  const hasStoredSession = Boolean(getAccessToken() || getRefreshToken());

  if (!hasStoredSession && !isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-sm text-slate-500 font-medium">Loading session…</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  const required = moduleOverride || resolveRouteModule(location.pathname);
  const sessionOnly = location.pathname === "/settings";
  if (required && !sessionOnly && !can(required)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
}

export default ProtectedRoute;

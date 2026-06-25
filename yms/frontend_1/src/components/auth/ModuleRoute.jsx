import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { useEmbeddedYardAccess } from "../../contexts/EmbeddedYardAccessContext";
import { getAccessToken, getRefreshToken } from "../../services/authStorage";
import { YARD_EMBEDDED, yardAuthPath, yardUnauthorizedPath } from "../../constants/basePath";

/** Enforces module permission for a single page inside the app shell. */
export function ModuleRoute({ module, children }) {
  const { ready, isAuthenticated, can } = useAuth();
  const { grantAllModules } = useEmbeddedYardAccess();
  const hasStoredSession = Boolean(getAccessToken() || getRefreshToken());

  if (!hasStoredSession && !isAuthenticated) {
    if (YARD_EMBEDDED) {
      return (
        <div className="min-h-[40vh] flex items-center justify-center text-sm text-slate-500">
          Opening Yard…
        </div>
      );
    }
    return <Navigate to={yardAuthPath()} replace />;
  }

  if (!ready) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center text-sm text-slate-500">
        Loading session…
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to={yardAuthPath()} replace />;
  }

  if (module && !grantAllModules && !can(module)) {
    return <Navigate to={yardUnauthorizedPath()} replace />;
  }

  return children;
}

export default ModuleRoute;

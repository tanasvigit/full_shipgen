import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

export default function RequirePermission({ permission, children }) {
  const { hasPermission } = useAuth();
  const location = useLocation();

  if (!hasPermission(permission)) {
    return <Navigate to="/" replace state={{ deniedFrom: location.pathname }} />;
  }

  return children;
}

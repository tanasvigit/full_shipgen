import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

export default function RequireAuth({ children }) {
    const location = useLocation();
    const { authReady, isAuthenticated } = useAuth();

    if (!authReady) {
        return null;
    }

    if (!isAuthenticated) {
        return <Navigate to="/auth" state={{ from: location.pathname }} replace />;
    }

    return children;
}

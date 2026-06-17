import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { env } from "@/lib/env";

export default function RequireAuth({ children }) {
    const location = useLocation();
    const { authReady, onboardingGateReady, shouldInstall, shouldOnboard, isAuthenticated } = useAuth();

    if (!authReady || !onboardingGateReady) {
        return null;
    }

    if (!isAuthenticated) {
        const installPath = env.INSTALLER_UI_ENABLED && shouldInstall;
        const nextPath = installPath ? "/install" : shouldOnboard ? "/auth/onboard" : "/auth";
        return <Navigate to={nextPath} state={{ from: location.pathname }} replace />;
    }

    return children;
}

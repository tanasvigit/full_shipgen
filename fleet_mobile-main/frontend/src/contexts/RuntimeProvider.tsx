import { useEffect } from "react";
import { useAuth } from "@/src/contexts/AuthContext";
import { initRuntimeOrchestrator, startRuntime, stopRuntime } from "@/src/runtime/lifecycle";

export function RuntimeProvider({ children }: { children: React.ReactNode }) {
  const { authReady, isAuthenticated, user, activeOrganization } = useAuth();

  useEffect(() => {
    return initRuntimeOrchestrator();
  }, []);

  useEffect(() => {
    if (!authReady) return;

    if (!isAuthenticated || !activeOrganization?.uuid || !user?.id) {
      void stopRuntime();
      return;
    }

    void startRuntime({
      companyUuid: activeOrganization.uuid,
      userId: user.id,
      driverPublicId: user.raw?.driver?.public_id || user.raw?.driver_uuid || null,
    });

    return () => {
      void stopRuntime();
    };
  }, [
    activeOrganization?.uuid,
    authReady,
    isAuthenticated,
    user?.id,
    user?.raw?.driver?.public_id,
    user?.raw?.driver_uuid,
  ]);

  return children;
}

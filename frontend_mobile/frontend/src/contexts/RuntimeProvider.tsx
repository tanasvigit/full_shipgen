import { useEffect } from "react";
import { useAuth } from "@/src/contexts/AuthContext";
import { initRuntimeOrchestrator, startRuntime, stopRuntime } from "@/src/runtime/lifecycle";
import { deviceService } from "@/src/services/deviceService";
import { loadDriverPreferences } from "@/src/utils/preferences";

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

    const driverTrackId =
      user.raw?.driver?.public_id || user.raw?.driver?.uuid || user.raw?.driver_uuid || null;

    void startRuntime({
      companyUuid: activeOrganization.uuid,
      userId: user.id,
      driverPublicId: driverTrackId,
      driverTrackId,
    });

    void loadDriverPreferences().then((prefs) => {
      if (prefs.pushNotifications) {
        void deviceService.registerCurrentDevice();
      }
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

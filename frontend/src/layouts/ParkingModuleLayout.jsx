import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { AuthProvider as ParkingAuthProvider } from "@pms/context/AuthContext";
import { ParkingFloorProvider } from "@pms/context/ParkingFloorContext";
import ParkingAppRoutes from "@pms/ParkingAppRoutes";
import ParkingPlatformSession from "@/components/parking/ParkingPlatformSession";

import "@pms/embedded.css";

export default function ParkingModuleLayout() {
  const location = useLocation();

  useEffect(() => {
    document.documentElement.classList.add("parking-embedded");
    return () => {
      document.documentElement.classList.remove("parking-embedded");
    };
  }, []);

  useEffect(() => {
    document.querySelector('[data-testid="console-main"]')?.scrollTo({ top: 0, left: 0 });
  }, [location.pathname]);

  return (
    <ParkingAuthProvider>
      <ParkingFloorProvider>
        <ParkingPlatformSession>
          <div className="min-w-0 text-[#0A0E1A]" data-testid="parking-module-main">
            <ParkingAppRoutes embedded />
          </div>
        </ParkingPlatformSession>
      </ParkingFloorProvider>
    </ParkingAuthProvider>
  );
}

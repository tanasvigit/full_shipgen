import { Outlet } from "react-router-dom";
import BookSlotDialog from "@yard/components/yms/BookSlotDialog";
import VehicleDrawer from "@yard/components/yms/VehicleDrawer";
import AppointmentDrawer from "@yard/components/yms/AppointmentDrawer";
import DockDrawer from "@yard/components/yms/DockDrawer";
import LoadingOpDrawer from "@yard/components/yms/LoadingOpDrawer";
import EquipmentDrawer from "@yard/components/yms/EquipmentDrawer";
import LaborDrawer from "@yard/components/yms/LaborDrawer";
import DetentionDrawer from "@yard/components/yms/DetentionDrawer";
import ExitVerificationDrawer from "@yard/components/yms/ExitVerificationDrawer";
import { UIProvider, useUI } from "@yard/contexts/UIContext";

const EquipmentDrawerHost = () => {
  const { equipment } = useUI();
  if (!equipment) return null;
  return <EquipmentDrawer />;
};

const LaborDrawerHost = () => {
  const { labor } = useUI();
  if (!labor) return null;
  return <LaborDrawer />;
};

const DetentionDrawerHost = () => {
  const { detention } = useUI();
  if (!detention) return null;
  return <DetentionDrawer />;
};

function YardShellInner() {
  return (
    <>
      <div className="min-w-0 text-[#0A0E1A]" data-testid="yard-module-main">
        <Outlet />
      </div>
      <BookSlotDialog />
      <AppointmentDrawer />
      <DockDrawer />
      <LoadingOpDrawer />
      <EquipmentDrawerHost />
      <LaborDrawerHost />
      <DetentionDrawerHost />
      <VehicleDrawer />
      <ExitVerificationDrawer />
    </>
  );
}

/** Yard module shell inside Shipgen ConsoleLayout — no YMS TopNav (uses global header/sidebar). */
export default function YardShell() {
  return (
    <UIProvider>
      <YardShellInner />
    </UIProvider>
  );
}

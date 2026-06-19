import React from "react";
import { Outlet } from "react-router-dom";
import TopNav from "./TopNav";
import { UIProvider, useUI } from "../../contexts/UIContext";
import { YARD_EMBEDDED } from "../../constants/basePath";
import BookSlotDialog from "./BookSlotDialog";
import VehicleDrawer from "./VehicleDrawer";
import AppointmentDrawer from "./AppointmentDrawer";
import DockDrawer from "./DockDrawer";
import LoadingOpDrawer from "./LoadingOpDrawer";
import EquipmentDrawer from "./EquipmentDrawer";
import LaborDrawer from "./LaborDrawer";
import DetentionDrawer from "./DetentionDrawer";
import ExitVerificationDrawer from "./ExitVerificationDrawer";
import { Toaster } from "../ui/sonner";

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

const AppLayoutShell = () => (
  <>
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <TopNav />
      <main
        className={`min-w-0 max-w-[100vw] ${YARD_EMBEDDED ? "" : "pt-[var(--yms-app-header-height,3.5rem)]"}`}
        data-testid="app-main"
      >
        <Outlet />
      </main>
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
    <Toaster position="top-right" richColors />
  </>
);

export const AppLayout = () => {
  return (
    <UIProvider>
      <AppLayoutShell />
    </UIProvider>
  );
};

export default AppLayout;

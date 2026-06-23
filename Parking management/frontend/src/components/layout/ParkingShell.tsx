import { Outlet } from 'react-router-dom';
import type { DashboardLayoutContext } from '../../hooks/useDashboardLayout';

const embeddedLayoutContext: DashboardLayoutContext = {
  sidebarOpen: false,
  sidebarCollapsed: false,
  onToggleSidebar: () => {},
};

/** Embedded parking shell — uses Shipgen console header/sidebar, no PMS chrome. */
export default function ParkingShell() {
  return (
    <div className="min-w-0 min-h-full bg-[#F5F6F8] text-[#0A0E1A]" data-testid="parking-shell">
      <Outlet context={embeddedLayoutContext} />
    </div>
  );
}

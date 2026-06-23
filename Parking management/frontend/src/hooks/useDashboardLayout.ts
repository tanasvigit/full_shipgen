import { useOutletContext } from 'react-router-dom';

export type DashboardLayoutContext = {
  sidebarOpen: boolean;
  sidebarCollapsed: boolean;
  onToggleSidebar: () => void;
};

export function useDashboardLayout(): DashboardLayoutContext {
  return useOutletContext<DashboardLayoutContext>();
}

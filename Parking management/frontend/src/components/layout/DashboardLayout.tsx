import { useCallback, useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import type { UserRole } from '../../types';
import type { DashboardLayoutContext } from '../../hooks/useDashboardLayout';
import { readSidebarCollapsed, writeSidebarCollapsed } from '../../utils/sidebarStorage';

interface DashboardLayoutProps {
  role: UserRole;
}

export default function DashboardLayout({ role }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(readSidebarCollapsed);

  const toggleSidebar = useCallback(() => {
    setSidebarOpen((open) => !open);
  }, []);

  const closeSidebar = useCallback(() => {
    setSidebarOpen(false);
  }, []);

  const toggleSidebarCollapsed = useCallback(() => {
    setSidebarCollapsed((collapsed) => {
      const next = !collapsed;
      writeSidebarCollapsed(next);
      return next;
    });
  }, []);

  const outletContext: DashboardLayoutContext = {
    sidebarOpen,
    sidebarCollapsed,
    onToggleSidebar: toggleSidebar,
  };

  return (
    <div className="min-h-screen bg-surface" data-testid={`dashboard-layout-${role}`}>
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden transition-opacity duration-300"
          onClick={closeSidebar}
          data-testid="mobile-sidebar-overlay"
          aria-hidden
        />
      )}

      <div
        className={`fixed top-0 left-0 z-50 h-screen transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <Sidebar
          role={role}
          collapsed={sidebarCollapsed}
          onToggleCollapse={toggleSidebarCollapsed}
          onNavigate={closeSidebar}
        />
      </div>

      <div
        className={`min-h-screen flex flex-col transition-[margin-left] duration-300 ease-in-out max-lg:ml-0 ${
          sidebarCollapsed ? 'lg:ml-16' : 'lg:ml-60'
        }`}
      >
        <Outlet context={outletContext} />
      </div>
    </div>
  );
}

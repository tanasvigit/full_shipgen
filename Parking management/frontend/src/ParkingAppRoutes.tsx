import { Navigate, Route, Routes } from 'react-router-dom';
import ProtectedRoute from './guards/ProtectedRoute';
import DashboardLayout from './components/layout/DashboardLayout';
import ParkingShell from './components/layout/ParkingShell';
import { PERMISSIONS } from './config/permissions';
import { parkingAuthPath, parkingPath, PARKING_EMBEDDED } from './constants/basePath';

import LoginPage from './pages/LoginPage';
import AdminDashboard from './pages/admin/AdminDashboard';
import UserManagement from './pages/admin/UserManagement';
import PricingPage from './pages/admin/PricingPage';
import ParkingManagement from './pages/admin/ParkingManagement';
import ReportsPage from './pages/admin/ReportsPage';
import HardwarePage from './pages/admin/HardwarePage';
import QRMonitoring from './pages/admin/QRMonitoring';
import AuditLogs from './pages/admin/AuditLogs';
import SupervisorDashboard from './pages/supervisor/SupervisorDashboard';
import ParkingMonitoringPage from './pages/supervisor/ParkingMonitoringPage';
import SupervisorReportsPage from './pages/supervisor/SupervisorReportsPage';
import OperatorActivityPage from './pages/supervisor/OperatorActivityPage';
import SupervisorVehicleSearchPage from './pages/supervisor/SupervisorVehicleSearchPage';
import SupervisorQRMonitoringPage from './pages/supervisor/SupervisorQRMonitoringPage';
import SupervisorRecentTicketsPage from './pages/supervisor/SupervisorRecentTicketsPage';
import OperatorDashboard from './pages/operator/OperatorDashboard';
import NewTicketPage from './pages/operator/NewTicketPage';
import CollectPaymentPage from './pages/operator/CollectPaymentPage';
import QRPrintPage from './pages/operator/QRPrintPage';
import VehicleSearchPage from './pages/operator/VehicleSearchPage';
import RecentTicketsPage from './pages/operator/RecentTicketsPage';
import SettingsPage from './pages/shared/SettingsPage';
import FloorManagementPage from './pages/shared/FloorManagementPage';
import OperatorOccupancyPage from './pages/operator/OperatorOccupancyPage';
import ParkingUnauthorized from './pages/ParkingUnauthorized';
import ParkingHomeRedirect from './pages/ParkingHomeRedirect';
import type { UserRole } from './types';

function rp(path: string, embedded = PARKING_EMBEDDED) {
  return embedded ? path.replace(/^\//, '') : path;
}

function layoutFor(embedded: boolean, role: UserRole) {
  if (embedded) return <ParkingShell />;
  return <DashboardLayout role={role} />;
}

export default function ParkingAppRoutes({ embedded = PARKING_EMBEDDED }: { embedded?: boolean }) {
  const fallback = embedded ? (
    <Navigate to={parkingPath('/admin/dashboard')} replace />
  ) : (
    <Navigate to="/login" replace />
  );

  return (
    <Routes>
      {!embedded ? <Route path="/login" element={<LoginPage />} /> : null}
      {embedded ? <Route path="login" element={<Navigate to={parkingAuthPath()} replace />} /> : null}
      {embedded ? <Route index element={<ParkingHomeRedirect />} /> : null}
      {embedded ? <Route path="unauthorized" element={<ParkingUnauthorized />} /> : null}
      {!embedded ? <Route path="/" element={<Navigate to="/login" replace />} /> : null}

      <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
        <Route element={layoutFor(embedded, 'admin')}>
          <Route path={rp('/admin/dashboard', embedded)} element={<ProtectedRoute permission={PERMISSIONS.DASHBOARD_VIEW}><AdminDashboard /></ProtectedRoute>} />
          <Route path={rp('/admin/users', embedded)} element={<ProtectedRoute permission={PERMISSIONS.USERS_MANAGE}><UserManagement /></ProtectedRoute>} />
          <Route path={rp('/admin/pricing', embedded)} element={<ProtectedRoute permission={PERMISSIONS.PRICING_CONFIGURE}><PricingPage /></ProtectedRoute>} />
          <Route path={rp('/admin/parking', embedded)} element={<ProtectedRoute permission={PERMISSIONS.PARKING_MANAGE}><ParkingManagement /></ProtectedRoute>} />
          <Route path={rp('/admin/parking-floors', embedded)} element={<ProtectedRoute permission={PERMISSIONS.FLOORS_MANAGE}><FloorManagementPage /></ProtectedRoute>} />
          <Route path={rp('/admin/reports', embedded)} element={<ProtectedRoute permission={PERMISSIONS.REPORTS_ADMIN}><ReportsPage /></ProtectedRoute>} />
          <Route path={rp('/admin/hardware', embedded)} element={<ProtectedRoute permission={PERMISSIONS.HARDWARE_CONFIGURE}><HardwarePage /></ProtectedRoute>} />
          <Route path={rp('/admin/qr-monitoring', embedded)} element={<ProtectedRoute permission={PERMISSIONS.QR_MONITORING}><QRMonitoring /></ProtectedRoute>} />
          <Route path={rp('/admin/audit-logs', embedded)} element={<ProtectedRoute permission={PERMISSIONS.AUDIT_VIEW}><AuditLogs /></ProtectedRoute>} />
          <Route path={rp('/admin/settings', embedded)} element={<ProtectedRoute permission={PERMISSIONS.SETTINGS_MANAGE}><SettingsPage /></ProtectedRoute>} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute allowedRoles={['supervisor']} />}>
        <Route element={layoutFor(embedded, 'supervisor')}>
          <Route path={rp('/supervisor/dashboard', embedded)} element={<ProtectedRoute permission={PERMISSIONS.DASHBOARD_VIEW}><SupervisorDashboard /></ProtectedRoute>} />
          <Route path={rp('/supervisor/monitoring', embedded)} element={<ProtectedRoute permission={PERMISSIONS.PARKING_STATUS_VIEW}><ParkingMonitoringPage /></ProtectedRoute>} />
          <Route path={rp('/supervisor/parking-floors', embedded)} element={<ProtectedRoute permission={PERMISSIONS.FLOORS_MONITOR}><FloorManagementPage /></ProtectedRoute>} />
          <Route path={rp('/supervisor/vehicle-search', embedded)} element={<ProtectedRoute permission={PERMISSIONS.VEHICLE_SEARCH}><SupervisorVehicleSearchPage /></ProtectedRoute>} />
          <Route path={rp('/supervisor/qr-monitoring', embedded)} element={<ProtectedRoute permission={PERMISSIONS.QR_MONITORING}><SupervisorQRMonitoringPage /></ProtectedRoute>} />
          <Route path={rp('/supervisor/reports', embedded)} element={<ProtectedRoute permission={PERMISSIONS.REPORTS_VIEW}><SupervisorReportsPage /></ProtectedRoute>} />
          <Route path={rp('/supervisor/operator-activity', embedded)} element={<ProtectedRoute permission={PERMISSIONS.OPERATOR_ACTIVITY}><OperatorActivityPage /></ProtectedRoute>} />
          <Route path={rp('/supervisor/recent-tickets', embedded)} element={<ProtectedRoute permission={PERMISSIONS.RECENT_TICKETS}><SupervisorRecentTicketsPage /></ProtectedRoute>} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute allowedRoles={['operator']} />}>
        <Route element={layoutFor(embedded, 'operator')}>
          <Route path={rp('/operator/dashboard', embedded)} element={<ProtectedRoute permission={PERMISSIONS.DASHBOARD_VIEW}><OperatorDashboard /></ProtectedRoute>} />
          <Route path={rp('/operator/occupancy', embedded)} element={<ProtectedRoute permission={PERMISSIONS.FLOORS_SUMMARY}><OperatorOccupancyPage /></ProtectedRoute>} />
          <Route path={rp('/operator/new-ticket', embedded)} element={<ProtectedRoute permission={PERMISSIONS.TICKETS_CREATE}><NewTicketPage /></ProtectedRoute>} />
          <Route path={rp('/operator/collect-payment', embedded)} element={<ProtectedRoute permission={PERMISSIONS.PAYMENTS_COLLECT}><CollectPaymentPage /></ProtectedRoute>} />
          <Route path={rp('/operator/qr-print', embedded)} element={<ProtectedRoute permission={PERMISSIONS.QR_PRINT}><QRPrintPage /></ProtectedRoute>} />
          <Route path={rp('/operator/vehicle-search', embedded)} element={<ProtectedRoute permission={PERMISSIONS.VEHICLE_SEARCH}><VehicleSearchPage /></ProtectedRoute>} />
          <Route path={rp('/operator/recent-tickets', embedded)} element={<ProtectedRoute permission={PERMISSIONS.RECENT_TICKETS}><RecentTicketsPage /></ProtectedRoute>} />
          <Route path={rp('/operator/settings', embedded)} element={<ProtectedRoute permission={PERMISSIONS.SETTINGS_MANAGE}><SettingsPage /></ProtectedRoute>} />
        </Route>
      </Route>

      <Route path="*" element={fallback} />
    </Routes>
  );
}

import { useEffect } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import ModuleRoute from "./components/auth/ModuleRoute";
import { MOD } from "./constants/permissions";
import AppLayout from "./components/yms/AppLayout";
import Login from "./pages/Login";
import Unauthorized from "./pages/Unauthorized";
import Dashboard from "./pages/Dashboard";
import Appointments from "./pages/Appointments";
import Gate from "./pages/Gate";
import VirtualQueue from "./pages/VirtualQueue";
import YardMap from "./pages/YardMap";
import Docks from "./pages/Docks";
import Vehicles from "./pages/Vehicles";
import LoadingOps from "./pages/LoadingOps";
import Detention from "./pages/Detention";
import Equipment from "./pages/Equipment";
import Labor from "./pages/Labor";
import AiInsights from "./pages/AiInsights";
import Kpis from "./pages/Kpis";
import OperationsDashboard from "./pages/OperationsDashboard";
import DelayAnalysisReport from "./pages/DelayAnalysisReport";
import Settings from "./pages/Settings";
import UserManagement from "./pages/UserManagement";
import RoleManagement from "./pages/RoleManagement";
import NotFound from "./pages/NotFound";

const withModule = (module, Component) => (
  <ModuleRoute module={module}>
    <Component />
  </ModuleRoute>
);

function App() {
  useEffect(() => {
    document.title = "YARD.OS – Smart Yard Management System";
  }, []);

  return (
    <div className="App">
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/loagin" element={<Navigate to="/login" replace />} />
            <Route path="/dashboard" element={<Navigate to="/" replace />} />
            <Route path="/virtual-queue" element={<Navigate to="/queue" replace />} />
            <Route path="/yard-map" element={<Navigate to="/yard" replace />} />
            <Route path="/loading-ops" element={<Navigate to="/loading" replace />} />
            <Route path="/unauthorized" element={<Unauthorized />} />
            <Route
              element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              <Route path="/" element={withModule(MOD.CONTROL_TOWER, Dashboard)} />
              <Route path="/appointments" element={withModule(MOD.APPOINTMENTS, Appointments)} />
              <Route path="/gate" element={withModule(MOD.GATE, Gate)} />
              <Route path="/queue" element={withModule(MOD.QUEUE, VirtualQueue)} />
              <Route path="/yard" element={withModule(MOD.YARD_MAP, YardMap)} />
              <Route path="/docks" element={withModule(MOD.DOCKS, Docks)} />
              <Route path="/vehicles" element={withModule(MOD.VEHICLES, Vehicles)} />
              <Route path="/loading" element={withModule(MOD.LOADING, LoadingOps)} />
              <Route path="/detention" element={withModule(MOD.DETENTION, Detention)} />
              <Route path="/equipment" element={withModule(MOD.EQUIPMENT, Equipment)} />
              <Route path="/labor" element={withModule(MOD.LABOR, Labor)} />
              <Route path="/ai" element={withModule(MOD.AI, AiInsights)} />
              <Route path="/kpis" element={withModule(MOD.KPIS, Kpis)} />
              <Route path="/operations-dashboard" element={withModule(MOD.OPS_DASHBOARD, OperationsDashboard)} />
              <Route path="/reports/delay-analysis" element={withModule(MOD.DELAY_ANALYSIS, DelayAnalysisReport)} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/admin/users" element={withModule(MOD.USER_MGMT, UserManagement)} />
              <Route path="/admin/roles" element={withModule(MOD.ROLE_MGMT, RoleManagement)} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </div>
  );
}

export default App;

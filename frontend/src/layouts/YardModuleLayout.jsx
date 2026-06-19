import { lazy, Suspense, useEffect } from "react";
import { Route, Routes, Navigate, useLocation } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import ModuleRoute from "@yard/components/auth/ModuleRoute";
import { MOD } from "@yard/constants/permissions";
import { yardPath } from "@yard/constants/basePath";
import { AuthProvider as YardAuthProvider } from "@yard/contexts/AuthContext";
import YardShell from "@/components/yard/YardShell";
import YardPlatformSession from "@/components/yard/YardPlatformSession";
import YardUnauthorized from "@/pages/yard/YardUnauthorized";
import SuspenseFallback from "@/components/loaders/transitions/SuspenseFallback";

import "@yard/index.css";

const Dashboard = lazy(() => import("@yard/pages/Dashboard"));
const Appointments = lazy(() => import("@yard/pages/Appointments"));
const Gate = lazy(() => import("@yard/pages/Gate"));
const VirtualQueue = lazy(() => import("@yard/pages/VirtualQueue"));
const YardMap = lazy(() => import("@yard/pages/YardMap"));
const Docks = lazy(() => import("@yard/pages/Docks"));
const Vehicles = lazy(() => import("@yard/pages/Vehicles"));
const LoadingOps = lazy(() => import("@yard/pages/LoadingOps"));
const Detention = lazy(() => import("@yard/pages/Detention"));
const Equipment = lazy(() => import("@yard/pages/Equipment"));
const Labor = lazy(() => import("@yard/pages/Labor"));
const AiInsights = lazy(() => import("@yard/pages/AiInsights"));
const Kpis = lazy(() => import("@yard/pages/Kpis"));
const OperationsDashboard = lazy(() => import("@yard/pages/OperationsDashboard"));
const DelayAnalysisReport = lazy(() => import("@yard/pages/DelayAnalysisReport"));
const Settings = lazy(() => import("@yard/pages/Settings"));
const UserManagement = lazy(() => import("@yard/pages/UserManagement"));
const RoleManagement = lazy(() => import("@yard/pages/RoleManagement"));

const yardQueryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      refetchOnWindowFocus: false,
    },
  },
});

function withModule(module, Component) {
  return (
    <ModuleRoute module={module}>
      <Component />
    </ModuleRoute>
  );
}

function YardRoutesInner() {
  return (
      <Suspense fallback={<SuspenseFallback message="Loading yard module…" />}>
      <Routes>
        <Route path="connect" element={<Navigate to={yardPath("/")} replace />} />
        <Route path="unauthorized" element={<YardUnauthorized />} />
        <Route element={<YardShell />}>
          <Route index element={withModule(MOD.CONTROL_TOWER, Dashboard)} />
          <Route path="appointments" element={withModule(MOD.APPOINTMENTS, Appointments)} />
          <Route path="gate" element={withModule(MOD.GATE, Gate)} />
          <Route path="queue" element={withModule(MOD.QUEUE, VirtualQueue)} />
          <Route path="yard" element={withModule(MOD.YARD_MAP, YardMap)} />
          <Route path="docks" element={withModule(MOD.DOCKS, Docks)} />
          <Route path="vehicles" element={withModule(MOD.VEHICLES, Vehicles)} />
          <Route path="loading" element={withModule(MOD.LOADING, LoadingOps)} />
          <Route path="detention" element={withModule(MOD.DETENTION, Detention)} />
          <Route path="equipment" element={withModule(MOD.EQUIPMENT, Equipment)} />
          <Route path="labor" element={withModule(MOD.LABOR, Labor)} />
          <Route path="ai" element={withModule(MOD.AI, AiInsights)} />
          <Route path="kpis" element={withModule(MOD.KPIS, Kpis)} />
          <Route path="operations-dashboard" element={withModule(MOD.OPS_DASHBOARD, OperationsDashboard)} />
          <Route path="reports/delay-analysis" element={withModule(MOD.DELAY_ANALYSIS, DelayAnalysisReport)} />
          <Route path="settings" element={<Settings />} />
          <Route path="admin/users" element={withModule(MOD.USER_MGMT, UserManagement)} />
          <Route path="admin/roles" element={withModule(MOD.ROLE_MGMT, RoleManagement)} />
        </Route>
        <Route path="*" element={<Navigate to={yardPath("/")} replace />} />
      </Routes>
    </Suspense>
  );
}

export default function YardModuleLayout() {
  const location = useLocation();

  useEffect(() => {
    document.documentElement.classList.add("yard-embedded");
    document.documentElement.style.setProperty("--yms-app-header-height", "0px");
    return () => {
      document.documentElement.classList.remove("yard-embedded");
      document.documentElement.style.removeProperty("--yms-app-header-height");
    };
  }, []);

  useEffect(() => {
    document.querySelector('[data-testid="console-main"]')?.scrollTo({ top: 0, left: 0 });
  }, [location.pathname]);

  return (
    <QueryClientProvider client={yardQueryClient}>
      <YardAuthProvider>
        <YardPlatformSession>
          <YardRoutesInner />
        </YardPlatformSession>
      </YardAuthProvider>
    </QueryClientProvider>
  );
}

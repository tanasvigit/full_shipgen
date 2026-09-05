import { Component, lazy, Suspense, useEffect } from "react";
import { Route, Routes, Navigate, useLocation } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import ModuleRoute from "@yard/components/auth/ModuleRoute";
import { MOD } from "@yard/constants/permissions";
import { yardPath } from "@yard/constants/basePath";
import { AuthProvider as YardAuthProvider } from "@yard/contexts/AuthContext";
import { EmbeddedYardAccessProvider } from "@yard/contexts/EmbeddedYardAccessContext";
import YardShell from "@/components/yard/YardShell";
import YardPlatformSession from "@/components/yard/YardPlatformSession";
import YardUnauthorized from "@/pages/yard/YardUnauthorized";
import SuspenseFallback from "@/components/loaders/transitions/SuspenseFallback";
import { useAuth } from "@/contexts/AuthContext";
import { resolveConsoleAdmin } from "@/lib/consoleAccess";
import { Button } from "@/components/ui/button";
/** Default Yard home — eager so /yard never depends on a hanging React.lazy() chunk. */
import Dashboard from "@yard/pages/Dashboard";

import "@yard/index.css";

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

/** Surfaces lazy-chunk / render failures instead of an infinite Suspense spinner. */
class YardLazyErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    if (import.meta.env.DEV) {
      console.error("[Yard] lazy route failed", error, info?.componentStack);
    }
  }

  componentDidUpdate(prevProps) {
    if (prevProps.resetKey !== this.props.resetKey && this.state.error) {
      this.setState({ error: null });
    }
  }

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    return (
      <div
        className="mx-auto flex max-w-lg flex-col gap-3 px-6 py-10 text-sm text-[#4B5563]"
        data-testid="yard-lazy-error"
        role="alert"
      >
        <h1 className="font-display text-xl font-black tracking-tight text-[#0A0E1A]">Yard module failed to load</h1>
        <p>A Yard page chunk could not be loaded. Reload the page, or open Control Tower and try again.</p>
        {import.meta.env.DEV ? (
          <pre className="max-h-40 overflow-auto rounded bg-[#F1F2F5] p-3 text-left text-xs text-red-700 whitespace-pre-wrap">
            {error.message || String(error)}
          </pre>
        ) : null}
        <div className="flex flex-wrap gap-2">
          <Button type="button" onClick={() => window.location.reload()}>
            Reload page
          </Button>
          <Button type="button" variant="outline" onClick={() => this.setState({ error: null })}>
            Try again
          </Button>
        </div>
      </div>
    );
  }
}

function withModule(module, Component) {
  return (
    <ModuleRoute module={module}>
      <Component />
    </ModuleRoute>
  );
}

function YardRoutesInner() {
  const location = useLocation();

  return (
    <YardLazyErrorBoundary resetKey={location.pathname}>
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
    </YardLazyErrorBoundary>
  );
}

function YardModuleLayoutInner() {
  const { user, hasPermission, canFleetops } = useAuth();
  const grantAllModules = resolveConsoleAdmin(user, { canFleetops, hasPermission });

  return (
    <EmbeddedYardAccessProvider grantAllModules={grantAllModules}>
      <YardAuthProvider>
        <YardPlatformSession>
          <YardRoutesInner />
        </YardPlatformSession>
      </YardAuthProvider>
    </EmbeddedYardAccessProvider>
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
      <YardModuleLayoutInner />
    </QueryClientProvider>
  );
}

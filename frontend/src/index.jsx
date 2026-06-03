import React, { Suspense } from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "@/index.css";
import App from "@/App";
import { AuthProvider } from "@/contexts/AuthContext";
import { TenantProvider } from "@/contexts/TenantContext";
import { PlatformProvider } from "@/contexts/PlatformContext";
import { DemoModeProvider } from "@/contexts/DemoModeContext";
import { LoadingProvider } from "@/providers/LoadingProvider";
import SuspenseFallback from "@/components/loaders/transitions/SuspenseFallback";
import PlatformErrorBoundary from "@/components/platform/PlatformErrorBoundary";
import { validateRuntimeConfig } from "@/lib/runtimeConfig";
import "@/domain/fleetops/extensions/bootstrap.jsx";

const configIssues = validateRuntimeConfig();
if (configIssues.length > 0 && import.meta.env.DEV) {
  console.warn("[FleetOps] Runtime config issues:", configIssues);
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <PlatformErrorBoundary>
      <AuthProvider>
        <TenantProvider>
          <PlatformProvider>
            <DemoModeProvider>
              <BrowserRouter>
                <LoadingProvider>
                  <Suspense fallback={<SuspenseFallback />}>
                    <App />
                  </Suspense>
                </LoadingProvider>
              </BrowserRouter>
            </DemoModeProvider>
          </PlatformProvider>
        </TenantProvider>
      </AuthProvider>
    </PlatformErrorBoundary>
  </React.StrictMode>,
);

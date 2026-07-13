import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { platformLogin } from "@yard/services/authApi";
import { useAuth as useYardAuth } from "@yard/contexts/AuthContext";
import { getAccessToken, getRefreshToken } from "@yard/services/authStorage";
import { authStorage } from "@/lib/storage";
import { useAuth } from "@/contexts/AuthContext";
import { SESSION_SCOPE } from "@/lib/sessionScope";
import { resolveConsoleAdmin } from "@/lib/consoleAccess";
import { yardPath } from "@yard/constants/basePath";
import SuspenseFallback from "@/components/loaders/transitions/SuspenseFallback";

/**
 * Silently exchanges the Shipgen admin session for a Yard JWT when the Yard module loads.
 * Yard-only operator sessions and non-admin Shipgen users use existing YMS tokens or are blocked.
 */
export default function YardPlatformSession({ children }) {
  const navigate = useNavigate();
  const { user, isYardOnlySession, sessionScope, hasPermission, canFleetops } = useAuth();
  const isConsoleAdmin = resolveConsoleAdmin(user, { canFleetops, hasPermission });
  const { refresh, ready, isAuthenticated } = useYardAuth();
  const [bridgeState, setBridgeState] = useState("pending");

  useEffect(() => {
    if (bridgeState === "ready") return undefined;

    let cancelled = false;

    const markReady = async () => {
      try {
        await refresh();
        if (!cancelled) setBridgeState("ready");
      } catch {
        if (!cancelled) setBridgeState("failed");
      }
    };

    if (getAccessToken() || getRefreshToken()) {
      void markReady();
      return () => {
        cancelled = true;
      };
    }

    if (isYardOnlySession || sessionScope === SESSION_SCOPE.YARD_ONLY) {
      setBridgeState("failed");
      navigate("/auth?redirect=/yard", { replace: true });
      return undefined;
    }

    const shipgenAuth = authStorage.get();
    if (!shipgenAuth?.token) {
      setBridgeState("failed");
      navigate("/auth?redirect=/yard", { replace: true });
      return undefined;
    }

    if (!isConsoleAdmin) {
      setBridgeState("failed");
      navigate(yardPath("/unauthorized"), { replace: true });
      return undefined;
    }

    (async () => {
      try {
        await platformLogin(shipgenAuth.token);
        if (cancelled) return;
        await refresh();
        if (!cancelled) setBridgeState("ready");
      } catch {
        if (cancelled) return;
        if (getAccessToken() || getRefreshToken()) {
          await markReady();
          return;
        }
        if (!cancelled) setBridgeState("failed");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [bridgeState, navigate, refresh, isYardOnlySession, sessionScope, isConsoleAdmin]);

  useEffect(() => {
    if (isAuthenticated && bridgeState !== "ready") {
      setBridgeState("ready");
    }
  }, [isAuthenticated, bridgeState]);

  if (bridgeState === "pending" || (bridgeState === "ready" && !ready)) {
    return <SuspenseFallback message="Opening Yard…" />;
  }

  if (bridgeState === "failed") {
    return (
      <div className="mx-auto flex max-w-lg flex-col gap-3 px-6 py-10 text-sm text-[#4B5563]">
        <h1 className="font-display text-xl font-black tracking-tight text-[#0A0E1A]">Yard unavailable</h1>
        <p>
          Yard could not be opened with this session. Shipgen administrators are bridged automatically; yard operators
          should sign in with a yard account from the login page.
        </p>
      </div>
    );
  }

  return children;
}

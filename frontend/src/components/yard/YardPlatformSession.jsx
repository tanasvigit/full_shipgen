import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { platformLogin } from "@yard/services/authApi";
import { useAuth as useYardAuth } from "@yard/contexts/AuthContext";
import { getAccessToken, getRefreshToken } from "@yard/services/authStorage";
import { authStorage } from "@/lib/storage";
import SuspenseFallback from "@/components/loaders/transitions/SuspenseFallback";

/**
 * Silently exchanges the Shipgen session for a Yard JWT when the Yard module loads.
 */
export default function YardPlatformSession({ children }) {
  const navigate = useNavigate();
  const { refresh, ready, isAuthenticated } = useYardAuth();
  const [bridgeState, setBridgeState] = useState(() =>
    getAccessToken() || getRefreshToken() ? "ready" : "pending",
  );
  const attemptedRef = useRef(false);

  useEffect(() => {
    if (bridgeState === "ready" || attemptedRef.current) return;
    if (getAccessToken() || getRefreshToken()) {
      setBridgeState("ready");
      return;
    }

    const shipgenAuth = authStorage.get();
    if (!shipgenAuth?.token) {
      setBridgeState("failed");
      navigate("/auth/login?redirect=/yard", { replace: true });
      return;
    }

    attemptedRef.current = true;
    let cancelled = false;

    (async () => {
      try {
        await platformLogin(shipgenAuth.token);
        if (cancelled) return;
        await refresh();
        if (!cancelled) setBridgeState("ready");
      } catch {
        if (!cancelled) setBridgeState("failed");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [bridgeState, navigate, refresh]);

  useEffect(() => {
    if (isAuthenticated && bridgeState !== "ready") {
      setBridgeState("ready");
    }
  }, [isAuthenticated, bridgeState]);

  if (bridgeState === "pending" || (!ready && bridgeState !== "failed")) {
    return <SuspenseFallback message="Opening Yard…" />;
  }

  if (bridgeState === "failed") {
    return (
      <div className="mx-auto flex max-w-lg flex-col gap-3 px-6 py-10 text-sm text-[#4B5563]">
        <h1 className="font-display text-xl font-black tracking-tight text-[#0A0E1A]">Yard unavailable</h1>
        <p>We could not open Yard with your Shipgen session. Sign in again or contact an administrator.</p>
      </div>
    );
  }

  return children;
}

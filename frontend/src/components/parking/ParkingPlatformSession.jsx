import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { platformLogin } from "@pms/api/auth";
import { getToken } from "@pms/api/client";
import { useAuth as useParkingAuth } from "@pms/context/AuthContext";
import { authStorage } from "@/lib/storage";
import { useAuth } from "@/contexts/AuthContext";
import { SESSION_SCOPE } from "@/lib/sessionScope";
import { resolveConsoleAdmin } from "@/lib/consoleAccess";
import { parkingPath } from "@pms/constants/basePath";
import SuspenseFallback from "@/components/loaders/transitions/SuspenseFallback";

/** Exchange Shipgen IAM session for a PMS JWT when the Parking module loads. */
export default function ParkingPlatformSession({ children }) {
  const navigate = useNavigate();
  const { isParkingOnlySession, sessionScope, hasPermission, canFleetops, user: shipgenUser } = useAuth();
  const isConsoleAdmin = resolveConsoleAdmin(shipgenUser, { canFleetops, hasPermission });
  const { reloadSession, user: parkingUser, isInitializing } = useParkingAuth();
  const [bridgeState, setBridgeState] = useState(() => (getToken() ? "ready" : "pending"));
  const attemptedRef = useRef(false);

  useEffect(() => {
    if (bridgeState === "ready" || attemptedRef.current) return;
    if (getToken()) {
      setBridgeState("ready");
      return;
    }

    if (isParkingOnlySession || sessionScope === SESSION_SCOPE.PARKING_ONLY) {
      setBridgeState("failed");
      navigate("/auth?redirect=/parking", { replace: true });
      return;
    }

    const shipgenAuth = authStorage.get();
    if (!shipgenAuth?.token) {
      setBridgeState("failed");
      navigate("/auth?redirect=/parking", { replace: true });
      return;
    }

    if (!isConsoleAdmin) {
      setBridgeState("failed");
      navigate(parkingPath("/unauthorized"), { replace: true });
      return;
    }

    attemptedRef.current = true;
    let cancelled = false;

    (async () => {
      try {
        await platformLogin(shipgenAuth.token);
        if (cancelled) return;
        await reloadSession();
        if (!cancelled) setBridgeState("ready");
      } catch {
        if (!cancelled) setBridgeState("failed");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [bridgeState, navigate, reloadSession, isParkingOnlySession, sessionScope, isConsoleAdmin]);

  useEffect(() => {
    if (parkingUser && bridgeState !== "ready") {
      setBridgeState("ready");
    }
  }, [parkingUser, bridgeState]);

  if (bridgeState === "pending" || (isInitializing && bridgeState !== "failed")) {
    return <SuspenseFallback message="Opening Parking…" />;
  }

  if (bridgeState === "failed") {
    return (
      <div className="mx-auto flex max-w-lg flex-col gap-3 px-6 py-10 text-sm text-[#4B5563]">
        <h1 className="font-display text-xl font-black tracking-tight text-[#0A0E1A]">Parking unavailable</h1>
        <p>
          Parking could not be opened with this session. Shipgen administrators are bridged automatically; parking
          staff should sign in with a parking account from the login page.
        </p>
      </div>
    );
  }

  return children;
}

import { useRef } from "react";
import { Outlet, Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

export default function AuthLayout() {
    const location = useLocation();
    const { authReady, onboardingGateReady, shouldInstall, shouldOnboard, isAuthenticated } = useAuth();
    const installSessionRef = useRef(false);
    if (location.pathname === "/install" && shouldInstall) {
        installSessionRef.current = true;
    }
    if (!authReady || !onboardingGateReady) {
        return <div className="min-h-screen grid place-items-center text-sm text-[#4B5563]">Loading...</div>;
    }
    if (isAuthenticated) return <Navigate to="/" replace />;
    if (shouldInstall && location.pathname !== "/install") {
        return <Navigate to="/install" replace />;
    }
    // Cold visit to /install when already set up — bypass installer UI.
    // Stay on /install after completing steps so user can choose Continue / Login.
    if (!shouldInstall && location.pathname === "/install" && !installSessionRef.current) {
        return <Navigate to={shouldOnboard ? "/auth/onboard" : "/auth"} replace />;
    }
    if (shouldOnboard && location.pathname === "/auth") {
        return <Navigate to="/auth/onboard" replace />;
    }
    return (
        <div className="min-h-screen w-full bg-[#F5F6F8] text-[#0A0E1A] grid lg:grid-cols-[1.15fr_1fr] grid-cols-1 relative overflow-hidden">
            {/* Left hero panel — light, gradient + grid */}
            <div className="relative hidden lg:flex flex-col p-14 overflow-hidden bg-white border-r border-black/[0.06]">
                {/* Background washes */}
                <div className="absolute top-[-180px] -left-[140px] h-[520px] w-[520px] rounded-full bg-[#0066FF]/[0.10] blur-[120px] pointer-events-none" />
                <div className="absolute bottom-[-160px] right-[-120px] h-[420px] w-[420px] rounded-full bg-[#7C3AED]/[0.08] blur-[120px] pointer-events-none" />
                <div className="absolute inset-0 grid-bg opacity-[0.6] grid-bg-mask pointer-events-none" />
                <div className="absolute inset-0 noise-overlay" />

                {/* Brand */}
                <div className="flex items-center gap-3.5 relative z-10" data-testid="auth-brand">
                    <img
                        src="/logo_logistic.png"
                        alt="Shipgen"
                        className="h-11 w-auto object-contain"
                    />
                    <div className="leading-tight">
                        <div className="font-mono text-[10px] tracking-[0.25em] text-[#374151] uppercase mt-0.5">Command Center · v3.0</div>
                    </div>
                </div>

                {/* Hero copy */}
                <div className="mt-auto space-y-8 max-w-xl relative z-10 anim-rise anim-rise-delay-1">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-black/[0.06] shadow-[0_4px_16px_-6px_rgba(10,14,26,0.08)]">
                        <span className="h-1.5 w-1.5 rounded-full bg-[#16A34A] animate-pulse shadow-[0_0_8px_rgba(22,163,74,0.6)]" />
                        <span className="font-mono text-[10px] tracking-[0.22em] uppercase text-[#0A0E1A]/95">Live · 24/7 Operations</span>
                    </div>
                    <h1 className="font-display text-[64px] font-black tracking-[-0.045em] leading-[0.95] text-[#0A0E1A] text-balance">
                        Move every parcel,<br />
                        <span className="bg-gradient-to-r from-[#0066FF] to-[#7C3AED] bg-clip-text text-transparent">vehicle and driver</span><br />
                        from a single console.
                    </h1>
                    <p className="text-[15px] text-[#4B5563] leading-relaxed max-w-md">
                        The unified operating layer for FleetOps, Storefront, Ledger, Pallet and IAM —
                        engineered for ops teams who treat logistics like a precision instrument.
                    </p>
                    <div className="flex items-center gap-8 pt-6 border-t border-black/[0.06]">
                        <div>
                            <div className="font-display text-2xl font-black tracking-[-0.04em] text-[#0A0E1A]">469</div>
                            <div className="font-mono text-[10px] tracking-[0.22em] text-[#4B5563] uppercase mt-1">Screens</div>
                        </div>
                        <div className="h-8 w-px bg-black/[0.06]" />
                        <div>
                            <div className="font-display text-2xl font-black tracking-[-0.04em] text-[#0A0E1A]">28</div>
                            <div className="font-mono text-[10px] tracking-[0.22em] text-[#4B5563] uppercase mt-1">Modules</div>
                        </div>
                        <div className="h-8 w-px bg-black/[0.06]" />
                        <div>
                            <div className="font-display text-2xl font-black tracking-[-0.04em] bg-gradient-to-r from-[#0066FF] to-[#7C3AED] bg-clip-text text-transparent">24/7</div>
                            <div className="font-mono text-[10px] tracking-[0.22em] text-[#4B5563] uppercase mt-1">Realtime</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right form panel */}
            <div className="relative flex items-center justify-center p-6 sm:p-12 bg-[#F5F6F8]">
                <div className="absolute inset-0 grid-bg-fine opacity-[0.5] grid-bg-mask pointer-events-none" />
                <div className="absolute top-1/3 right-1/4 h-[320px] w-[320px] rounded-full bg-[#0066FF]/[0.06] blur-[100px] pointer-events-none" />

                {/* Mobile brand */}
                <div className="lg:hidden absolute top-6 left-6 flex items-center gap-2.5">
                    <img
                        src="/logo_logistic.png"
                        alt="Shipgen"
                        className="h-9 w-auto object-contain"
                    />
                </div>

                <div className="w-full max-w-md relative z-10 anim-rise anim-rise-delay-2 bg-white border border-black/[0.06] rounded-2xl shadow-[0_24px_56px_-16px_rgba(10,14,26,0.12)] p-8">
                    <Outlet />
                </div>
            </div>
        </div>
    );
}

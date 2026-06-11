import { useCallback, useEffect, useRef, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ShieldCheck, ArrowLeft, Loader2, Mail, Smartphone } from "lucide-react";
import { InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator } from "@/components/ui/input-otp";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { features } from "@/lib/features";

const RESEND_COOLDOWN_SEC = 60;

function maskDestination(identity, method) {
  if (!identity) return "your account";
  if (method === "sms" && identity.startsWith("+")) {
    return identity.length > 4 ? `phone ending in ${identity.slice(-4)}` : "your phone";
  }
  const [local, domain] = String(identity).split("@");
  if (!domain) return identity;
  const maskedLocal = local.length <= 2 ? `${local[0] || ""}*` : `${local.slice(0, 2)}***`;
  return `${maskedLocal}@${domain}`;
}

export default function TwoFA() {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [bootstrapping, setBootstrapping] = useState(true);
  const [error, setError] = useState(null);
  const [status, setStatus] = useState(null);
  const [resendCooldown, setResendCooldown] = useState(0);
  const navigate = useNavigate();
  const submitLock = useRef(false);
  const {
    authReady,
    isAuthenticated,
    requiresTwoFactor,
    session,
    beginTwoFactorSession,
    resendTwoFactorCode,
    completeTwoFactor,
    cancelTwoFactor,
  } = useAuth();

  const method = session?.twoFaMethod || "email";
  const destination = maskDestination(session?.twoFaIdentity, method);
  const MethodIcon = method === "sms" ? Smartphone : Mail;

  useEffect(() => {
    if (!requiresTwoFactor) return undefined;
    let active = true;
    setBootstrapping(true);
    setError(null);
    beginTwoFactorSession()
      .then(() => {
        if (!active) return;
        setStatus(`We sent a 6-digit code to ${destination}.`);
        setResendCooldown(RESEND_COOLDOWN_SEC);
      })
      .catch((err) => {
        if (!active) return;
        setError(err?.message || "Unable to start verification.");
      })
      .finally(() => {
        if (active) setBootstrapping(false);
      });
    return () => {
      active = false;
    };
  }, [beginTwoFactorSession, destination, requiresTwoFactor]);

  useEffect(() => {
    if (resendCooldown <= 0) return undefined;
    const timer = window.setInterval(() => {
      setResendCooldown((value) => (value > 0 ? value - 1 : 0));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [resendCooldown]);

  const submit = useCallback(
    async (rawCode) => {
      const normalized = String(rawCode || "").replace(/\D/g, "").slice(0, 6);
      if (normalized.length < 6 || submitLock.current || loading) return;
      submitLock.current = true;
      setLoading(true);
      setError(null);
      try {
        await completeTwoFactor(normalized);
        toast.success("Signed in securely");
        navigate("/", { replace: true });
      } catch (err) {
        setError(err?.message || "Invalid or expired code.");
        setCode("");
      } finally {
        setLoading(false);
        submitLock.current = false;
      }
    },
    [completeTwoFactor, loading, navigate],
  );

  useEffect(() => {
    if (code.length === 6 && !bootstrapping) {
      void submit(code);
    }
  }, [bootstrapping, code, submit]);

  const handleResend = async () => {
    if (resendCooldown > 0 || loading) return;
    setError(null);
    setStatus(null);
    try {
      await resendTwoFactorCode();
      setStatus(`A new code was sent to ${destination}.`);
      setResendCooldown(RESEND_COOLDOWN_SEC);
      toast.success("Verification code resent");
    } catch (err) {
      setError(err?.message || "Unable to resend code.");
    }
  };

  const handleUseDifferentAccount = async () => {
    await cancelTwoFactor();
    navigate("/auth", { replace: true });
  };

  if (!features.twoFaEnabled) {
    return <Navigate to="/auth" replace />;
  }

  if (authReady && isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  if (authReady && !requiresTwoFactor) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <div className="space-y-6" data-testid="two-fa-page">
      <button
        type="button"
        onClick={() => void handleUseDifferentAccount()}
        className="inline-flex items-center gap-1 text-xs text-[#374151] hover:text-[#0A0E1A]"
      >
        <ArrowLeft className="h-3 w-3" /> Use a different account
      </button>

      <div className="flex items-center gap-3">
        <div className="h-10 w-10 bg-blue-500/10 border border-blue-500/30 grid place-items-center rounded-sm">
          <ShieldCheck className="h-5 w-5 text-[#0066FF]" strokeWidth={1.75} />
        </div>
        <div>
          <div className="overline">Two-factor authentication</div>
          <h2 className="font-display text-2xl font-black tracking-tighter">Check your {method === "sms" ? "phone" : "email"}</h2>
        </div>
      </div>

      <div className="flex items-start gap-3 rounded-lg border border-black/[0.08] bg-[#F5F6F8] px-4 py-3 text-sm text-[#374151]">
        <MethodIcon className="h-4 w-4 mt-0.5 shrink-0 text-[#0066FF]" />
        <div>
          {bootstrapping ? (
            <span className="inline-flex items-center gap-2">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Sending your verification code…
            </span>
          ) : (
            <>
              <div>Enter the 6-digit code sent to <span className="font-medium text-[#0A0E1A]">{destination}</span>.</div>
              <div className="text-xs text-[#6B7280] mt-1">Codes expire after about a minute for your security.</div>
            </>
          )}
        </div>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          void submit(code);
        }}
        className="space-y-5"
      >
        <div className="flex justify-center">
          <InputOTP
            maxLength={6}
            value={code}
            onChange={setCode}
            disabled={bootstrapping || loading}
            data-testid="two-fa-otp"
          >
            <InputOTPGroup>
              <InputOTPSlot index={0} className="bg-[#F1F2F5] border-black/[0.08] w-12 h-14 text-lg" />
              <InputOTPSlot index={1} className="bg-[#F1F2F5] border-black/[0.08] w-12 h-14 text-lg" />
              <InputOTPSlot index={2} className="bg-[#F1F2F5] border-black/[0.08] w-12 h-14 text-lg" />
            </InputOTPGroup>
            <InputOTPSeparator />
            <InputOTPGroup>
              <InputOTPSlot index={3} className="bg-[#F1F2F5] border-black/[0.08] w-12 h-14 text-lg" />
              <InputOTPSlot index={4} className="bg-[#F1F2F5] border-black/[0.08] w-12 h-14 text-lg" />
              <InputOTPSlot index={5} className="bg-[#F1F2F5] border-black/[0.08] w-12 h-14 text-lg" />
            </InputOTPGroup>
          </InputOTP>
        </div>

        {status && !error ? (
          <div className="text-xs text-[#166534] bg-green-500/10 border border-green-500/20 rounded-sm px-3 py-2 text-center" data-testid="two-fa-status">
            {status}
          </div>
        ) : null}

        {error ? (
          <div className="text-xs text-[#B91C1C] bg-red-500/10 border border-red-500/20 rounded-sm px-3 py-2 text-center" data-testid="two-fa-error">
            {error}
          </div>
        ) : null}

        <Button
          type="submit"
          disabled={loading || bootstrapping || code.length < 6}
          className="w-full h-11 bg-blue-600 hover:bg-blue-700 rounded-sm"
          data-testid="two-fa-submit"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Verify and sign in"}
        </Button>

        <div className="flex flex-col items-center gap-2 text-center text-xs text-[#4B5563]">
          <button
            type="button"
            onClick={() => void handleResend()}
            disabled={resendCooldown > 0 || bootstrapping || loading}
            className="text-[#0066FF] hover:text-[#0040CC] disabled:text-[#9CA3AF] disabled:cursor-not-allowed font-medium"
            data-testid="two-fa-resend"
          >
            {resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : "Resend code"}
          </button>
          <span>
            Didn&apos;t receive it? Check spam or{" "}
            <Link to="/auth/forgot-password" className="text-[#0066FF] hover:text-[#0040CC]">
              reset your password
            </Link>
            .
          </span>
        </div>
      </form>
    </div>
  );
}

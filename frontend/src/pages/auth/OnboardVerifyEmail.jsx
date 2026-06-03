import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import LoadingButton from "@/components/loaders/indicators/LoadingButton";
import { toast } from "sonner";

export default function OnboardVerifyEmail() {
  const navigate = useNavigate();
  const {
    onboardingSession,
    verifyOnboardingCode,
    resendOnboardingEmail,
    resendOnboardingSms,
  } = useAuth();
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [resendEmailBusy, setResendEmailBusy] = useState(false);
  const [resendSmsBusy, setResendSmsBusy] = useState(false);
  const [error, setError] = useState("");
  const [lastFailedAction, setLastFailedAction] = useState(null);
  const missingSession = !onboardingSession?.session;

  useEffect(() => {
    if (!missingSession) return;
    const timer = setTimeout(() => navigate("/auth/onboard", { replace: true }), 1800);
    return () => clearTimeout(timer);
  }, [missingSession, navigate]);

  const canSubmit = useMemo(
    () => !missingSession && !busy && code.trim().length > 0,
    [missingSession, busy, code],
  );

  const performVerify = async () => {
    if (busy) return;
    setError("");
    setLastFailedAction(null);
    if (!canSubmit) return;
    setBusy(true);
    try {
      await verifyOnboardingCode({ session: onboardingSession.session, code: code.trim() });
      toast.success("Verification successful.");
      navigate("/");
    } catch (err) {
      const code = err?.raw?.code || err?.code;
      if (code === "ONBOARDING_UNRECOVERABLE") {
        toast.error(err?.message || "Verification could not continue.");
        navigate("/auth", { replace: true });
        return;
      }
      const msg = err?.message || "Invalid verification code.";
      setError(msg);
      setLastFailedAction("verify");
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    await performVerify();
  };

  const resendEmail = async () => {
    if (missingSession || !onboardingSession?.email || resendEmailBusy) return;
    setResendEmailBusy(true);
    setError("");
    setLastFailedAction(null);
    try {
      await resendOnboardingEmail({
        session: onboardingSession.session,
        email: onboardingSession.email,
      });
      toast.success("Verification email sent.");
    } catch (err) {
      const msg = err?.message || "Could not resend verification email.";
      setError(msg);
      setLastFailedAction("resend-email");
      toast.error(msg);
    } finally {
      setResendEmailBusy(false);
    }
  };

  const resendSms = async () => {
    if (missingSession || !onboardingSession?.phone || resendSmsBusy) return;
    setResendSmsBusy(true);
    setError("");
    setLastFailedAction(null);
    try {
      await resendOnboardingSms({
        session: onboardingSession.session,
        phone: onboardingSession.phone,
      });
      toast.success("Verification SMS sent.");
    } catch (err) {
      const msg = err?.message || "Could not resend verification SMS.";
      setError(msg);
      setLastFailedAction("resend-sms");
      toast.error(msg);
    } finally {
      setResendSmsBusy(false);
    }
  };

  return (
    <div className="space-y-6" data-testid="onboard-verify-page">
      <div>
        <div className="overline mb-3">Verification</div>
        <h2 className="font-display text-[36px] font-black tracking-[-0.045em] leading-[1] text-[#0A0E1A]">
          Verify your email
          <br />
          to continue.
        </h2>
        <p className="text-sm text-[#374151] mt-3 max-w-sm">
          Enter the verification code sent to your inbox or phone to complete account setup.
        </p>
      </div>

      {missingSession ? (
        <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900" data-testid="onboard-verify-missing-session">
          We could not find a valid verification session. This usually happens after a refresh or expired signup flow.
          You will be redirected to restart onboarding safely.
          <div className="mt-3">
            <Button type="button" size="sm" variant="outline" onClick={() => navigate("/auth/onboard", { replace: true })}>
              Go to onboarding
            </Button>
          </div>
        </div>
      ) : (
        <form className="space-y-4" onSubmit={submit}>
          <div className="rounded-lg border border-black/[0.08] bg-[#F5F6F8] p-4 text-sm text-[#374151]">
            <div className="font-mono text-[12px] text-[#4B5563]" data-testid="onboard-verify-session">
              Session: {onboardingSession?.session}
            </div>
            <div className="font-mono text-[12px] text-[#4B5563] mt-1">
              Email: {onboardingSession?.email || "n/a"} · Phone: {onboardingSession?.phone || "n/a"}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="onboard-verify-code">Verification code</Label>
            <Input
              id="onboard-verify-code"
              value={code}
              onChange={(e) => {
                setCode(e.target.value);
                setError("");
              }}
              data-testid="onboard-verify-code"
              autoComplete="one-time-code"
              required
            />
          </div>

          {error ? (
            <div className="text-xs text-[#DC2626] bg-[#DC2626]/[0.06] border border-[#DC2626]/20 rounded-lg px-3.5 py-2.5" data-testid="onboard-verify-error">
              {error}
            </div>
          ) : null}
          {lastFailedAction ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                if (lastFailedAction === "verify") performVerify();
                if (lastFailedAction === "resend-email") resendEmail();
                if (lastFailedAction === "resend-sms") resendSms();
              }}
              disabled={busy || resendEmailBusy || resendSmsBusy}
              data-testid="onboard-verify-retry"
            >
              Retry last action
            </Button>
          ) : null}

          <div className="flex flex-wrap gap-2">
            <LoadingButton
              type="submit"
              loading={busy}
              loadingText="Verifying…"
              disabled={!canSubmit}
              className="bg-[#0066FF] hover:bg-[#0040CC] text-white"
              data-testid="onboard-verify-submit"
            >
              Verify and continue
            </LoadingButton>
            <Button
              type="button"
              variant="outline"
              onClick={resendEmail}
              disabled={resendEmailBusy || !onboardingSession?.email}
              data-testid="onboard-resend-email"
            >
              {resendEmailBusy ? "Resending email…" : "Resend email"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={resendSms}
              disabled={resendSmsBusy || !onboardingSession?.phone}
              data-testid="onboard-resend-sms"
            >
              {resendSmsBusy ? "Resending SMS…" : "Resend SMS"}
            </Button>
          </div>
        </form>
      )}

      <Button asChild variant="outline">
        <Link to="/auth/onboard">Back to onboarding</Link>
      </Button>
    </div>
  );
}

import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import LoadingButton from "@/components/loaders/indicators/LoadingButton";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const PASSWORD_HINT =
  "Password must be at least 8 characters and include uppercase, lowercase, number, and symbol.";

function toFieldErrorMap(message, fallback = "Unable to create account.") {
  const text = String(message || "").toLowerCase();
  const errors = {};
  if (text.includes("name")) errors.name = message;
  if (text.includes("email")) errors.email = message;
  if (text.includes("phone")) errors.phone = message;
  if (text.includes("organization")) errors.organization_name = message;
  if (text.includes("password confirmation") || text.includes("passwords do not match")) {
    errors.password_confirmation = message;
  } else if (text.includes("password")) {
    errors.password = message;
  }
  return Object.keys(errors).length > 0 ? errors : { form: fallback };
}

export default function Onboard() {
  const navigate = useNavigate();
  const { createOnboardingAccount, onboardingDraft, saveOnboardingDraft } = useAuth();
  const [form, setForm] = useState({
    name: onboardingDraft?.name || "",
    email: onboardingDraft?.email || "",
    phone: onboardingDraft?.phone || "",
    organization_name: onboardingDraft?.organization_name || "",
    password: "",
    password_confirmation: "",
  });
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState({});
  const [retryable, setRetryable] = useState(false);

  const canSubmit = useMemo(
    () =>
      !busy &&
      form.name.trim() &&
      form.email.trim() &&
      form.phone.trim() &&
      form.organization_name.trim() &&
      form.password &&
      form.password_confirmation,
    [busy, form],
  );

  const setField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (["name", "email", "phone", "organization_name"].includes(key)) {
      saveOnboardingDraft({ [key]: value });
    }
    setErrors((prev) => ({ ...prev, [key]: null, form: null }));
    setRetryable(false);
  };

  const validate = () => {
    const next = {};
    if (!form.name.trim()) next.name = "Full name is required.";
    if (!form.email.trim()) next.email = "Email is required.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) next.email = "Please enter a valid email.";
    if (!form.phone.trim()) next.phone = "Phone is required.";
    if (!form.organization_name.trim()) next.organization_name = "Organization name is required.";
    if (!form.password) next.password = "Password is required.";
    if (!form.password_confirmation) next.password_confirmation = "Please confirm your password.";
    if (form.password && form.password_confirmation && form.password !== form.password_confirmation) {
      next.password_confirmation = "Passwords do not match.";
    }
    return next;
  };

  const performSubmit = async () => {
    if (busy) return;
    setErrors({});
    setRetryable(false);
    const nextErrors = validate();
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setBusy(true);
    try {
      const result = await createOnboardingAccount(form);
      if (result.skipVerification) {
        navigate("/");
        return;
      }
      navigate("/auth/onboard/verify-email");
    } catch (error) {
      const code = error?.raw?.code || error?.code;
      if (code === "ONBOARDING_UNRECOVERABLE") {
        toast.error(error?.message || "Onboarding could not continue.");
        navigate("/auth", { replace: true });
        return;
      }
      const mapped = toFieldErrorMap(error?.message, "Unable to create account.");
      setErrors(mapped);
      setRetryable(Boolean(mapped?.form));
      toast.error(error?.message || "Create account failed.");
    } finally {
      setBusy(false);
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    await performSubmit();
  };

  return (
    <div className="space-y-6" data-testid="onboard-page">
      <div>
        <div className="overline mb-3">First-time setup</div>
        <h2 className="font-display text-[36px] font-black tracking-[-0.045em] leading-[1] text-[#0A0E1A]">
          Create your first
          <br />
          Fleetbase account.
        </h2>
        <p className="text-sm text-[#374151] mt-3 max-w-sm">
          Create your first account and organization to start using the Fleetbase console.
        </p>
      </div>

      <form className="space-y-4" onSubmit={submit} data-testid="onboard-form">
        <div className="space-y-1.5">
          <Label htmlFor="onboard-name">Full name</Label>
          <Input
            id="onboard-name"
            value={form.name}
            onChange={(e) => setField("name", e.target.value)}
            data-testid="onboard-name"
            autoComplete="name"
            required
          />
          {errors.name ? <p className="text-xs text-[#DC2626]" data-testid="onboard-name-error">{errors.name}</p> : null}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="onboard-email">Email</Label>
          <Input
            id="onboard-email"
            type="email"
            value={form.email}
            onChange={(e) => setField("email", e.target.value)}
            data-testid="onboard-email"
            autoComplete="email"
            required
          />
          {errors.email ? <p className="text-xs text-[#DC2626]" data-testid="onboard-email-error">{errors.email}</p> : null}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="onboard-phone">Phone</Label>
          <Input
            id="onboard-phone"
            type="tel"
            value={form.phone}
            onChange={(e) => setField("phone", e.target.value)}
            data-testid="onboard-phone"
            autoComplete="tel"
            required
          />
          {errors.phone ? <p className="text-xs text-[#DC2626]" data-testid="onboard-phone-error">{errors.phone}</p> : null}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="onboard-org-name">Organization name</Label>
          <Input
            id="onboard-org-name"
            value={form.organization_name}
            onChange={(e) => setField("organization_name", e.target.value)}
            data-testid="onboard-organization-name"
            autoComplete="organization"
            required
          />
          {errors.organization_name ? (
            <p className="text-xs text-[#DC2626]" data-testid="onboard-organization-name-error">{errors.organization_name}</p>
          ) : null}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="onboard-password">Password</Label>
          <Input
            id="onboard-password"
            type="password"
            value={form.password}
            onChange={(e) => setField("password", e.target.value)}
            data-testid="onboard-password"
            autoComplete="new-password"
            required
          />
          <p className="text-xs text-[#4B5563]">{PASSWORD_HINT}</p>
          {errors.password ? (
            <p className="text-xs text-[#DC2626]" data-testid="onboard-password-error">{errors.password}</p>
          ) : null}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="onboard-password-confirmation">Confirm password</Label>
          <Input
            id="onboard-password-confirmation"
            type="password"
            value={form.password_confirmation}
            onChange={(e) => setField("password_confirmation", e.target.value)}
            data-testid="onboard-password-confirmation"
            autoComplete="new-password"
            required
          />
          {errors.password_confirmation ? (
            <p className="text-xs text-[#DC2626]" data-testid="onboard-password-confirmation-error">{errors.password_confirmation}</p>
          ) : null}
        </div>

        {errors.form ? (
          <div className="text-xs text-[#DC2626] bg-[#DC2626]/[0.06] border border-[#DC2626]/20 rounded-lg px-3.5 py-2.5" data-testid="onboard-form-error">
            {errors.form}
          </div>
        ) : null}
        {retryable ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={performSubmit}
            disabled={busy}
            data-testid="onboard-retry-submit"
          >
            Retry create account
          </Button>
        ) : null}

        <div className="flex gap-3 pt-1">
          <LoadingButton
            type="submit"
            loading={busy}
            loadingText="Creating account…"
            disabled={!canSubmit}
            className="bg-[#0066FF] hover:bg-[#0040CC] text-white"
            data-testid="onboard-submit"
          >
            Create account
          </LoadingButton>
          <Button asChild variant="outline">
            <Link to="/auth">Back to login</Link>
          </Button>
        </div>
      </form>
    </div>
  );
}

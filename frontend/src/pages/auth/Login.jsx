import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Eye, EyeOff, ArrowRight, Fingerprint } from "lucide-react";
import LoadingButton from "@/components/loaders/indicators/LoadingButton";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

export default function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPw, setShowPw] = useState(false);
    const [remember, setRemember] = useState(true);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const navigate = useNavigate();
    const { login } = useAuth();

    async function submit(e) {
        e.preventDefault();
        setError(null);
        setLoading(true);
        try {
            const result = await login({ email, password, remember });
            if (result.requiresTwoFactor) {
                toast.success("Verification code required");
                navigate("/auth/two-fa");
                return;
            }
            toast.success("Signed in to Fleetbase Console");
            navigate("/");
        } catch (err) {
            setError(err.message || "Unable to sign in.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="space-y-7" data-testid="login-page">
            <div>
                <div className="overline mb-3">Sign in · Secure session</div>
                <h2 className="font-display text-[36px] font-black tracking-[-0.045em] leading-[1] text-[#0A0E1A]">
                    Welcome back to<br />your console.
                </h2>
                <p className="text-sm text-[#374151] mt-3 max-w-sm">
                    Enter your credentials to enter the Fleetbase Operations Console.
                </p>
            </div>

            <form onSubmit={submit} className="space-y-5" data-testid="login-form">
                <div className="space-y-2">
                    <Label htmlFor="email" className="overline">Email</Label>
                    <Input
                        id="email"
                        type="email"
                        autoComplete="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="h-12 bg-[#F5F6F8] border-black/[0.06] focus-visible:ring-2 focus-visible:ring-[#0066FF]/30 focus-visible:border-[#0066FF] transition-all rounded-lg text-[14px] font-mono text-[#0A0E1A]"
                        data-testid="login-email"
                    />
                </div>
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <Label htmlFor="password" className="overline">Password</Label>
                        <Link to="/auth/forgot-password" className="text-[11px] font-mono uppercase tracking-[0.18em] text-[#0066FF] hover:text-[#0040CC] transition-colors" data-testid="login-forgot-link">
                            Forgot →
                        </Link>
                    </div>
                    <div className="relative">
                        <Input
                            id="password"
                            type={showPw ? "text" : "password"}
                            autoComplete="current-password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="h-12 bg-[#F5F6F8] border-black/[0.06] focus-visible:ring-2 focus-visible:ring-[#0066FF]/30 focus-visible:border-[#0066FF] pr-12 transition-all rounded-lg text-[14px] font-mono text-[#0A0E1A]"
                            data-testid="login-password"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPw(!showPw)}
                            className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 grid place-items-center text-[#4B5563] hover:text-[#0A0E1A] hover:bg-black/[0.05] rounded-md transition-all"
                            aria-label={showPw ? "Hide password" : "Show password"}
                        >
                            {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                    </div>
                </div>
                <label className="flex items-center gap-2.5 text-xs text-[#374151] select-none cursor-pointer">
                    <Checkbox
                        checked={remember}
                        onCheckedChange={setRemember}
                        className="border-black/[0.18] data-[state=checked]:bg-[#0066FF] data-[state=checked]:border-[#0066FF] data-[state=checked]:text-white"
                        data-testid="login-remember"
                    />
                    Keep me signed in for 30 days
                </label>

                {error && (
                    <div className="text-xs text-[#DC2626] bg-[#DC2626]/[0.06] border border-[#DC2626]/20 rounded-lg px-3.5 py-2.5 font-mono" data-testid="login-error">
                        {error}
                    </div>
                )}

                <div className="space-y-3 pt-1">
                    <LoadingButton
                        type="submit"
                        loading={loading}
                        loadingText="Signing in…"
                        className="w-full h-12 bg-[#0066FF] hover:bg-[#0040CC] text-white font-semibold rounded-lg transition-all shadow-[0_10px_28px_-8px_rgba(0,102,255,0.45)] hover:shadow-[0_14px_32px_-8px_rgba(0,102,255,0.6)]"
                        data-testid="login-form-submit-button"
                    >
                        Sign in <ArrowRight className="h-4 w-4 ml-1.5" />
                    </LoadingButton>

                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => navigate("/auth/two-fa")}
                        className="w-full h-12 bg-white border-black/[0.08] hover:bg-[#F5F6F8] hover:text-[#0A0E1A] text-[#374151] font-medium rounded-lg transition-all"
                        data-testid="login-two-fa-button"
                    >
                        <Fingerprint className="h-4 w-4 mr-2" /> Sign in with 2FA
                    </Button>
                </div>
            </form>

            <div className="relative border border-dashed border-black/[0.1] bg-[#F5F6F8] rounded-lg p-4 text-xs space-y-1.5 overflow-hidden">
                <div className="absolute -top-px left-4 right-4 h-px bg-gradient-to-r from-transparent via-[#0066FF]/40 to-transparent" />
                <div className="overline">Secure authentication</div>
                <div className="font-mono text-[12px] text-[#4B5563]">Credentials are validated against your Fleetbase backend.</div>
            </div>

            <div className="text-center text-xs text-[#4B5563]">
                Don't have an account?{" "}
                <Link to="/auth/onboard" className="text-[#0066FF] hover:text-[#0040CC]" data-testid="login-create-account-link">
                    Create account
                </Link>
            </div>

            <div className="text-center pt-2 border-t border-black/[0.06]">
                <Link
                    to="/fleet-ops/tracking/lookup"
                    className="text-sm font-medium text-[#0066FF] hover:text-[#0040CC] inline-flex items-center gap-1"
                    data-testid="auth-track-order-link"
                >
                    Track an order →
                </Link>
            </div>
        </div>
    );
}

import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ShieldCheck, ArrowLeft, Loader2 } from "lucide-react";
import { InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator } from "@/components/ui/input-otp";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

export default function TwoFA() {
    const [code, setCode] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const navigate = useNavigate();
    const { completeTwoFactor } = useAuth();

    async function submit(e) {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            await completeTwoFactor(code);
            toast.success("2FA verified, welcome back");
            navigate("/");
        } catch (err) {
            setError(err.message || "Invalid or expired code.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="space-y-6" data-testid="two-fa-page">
            <Link to="/auth" className="inline-flex items-center gap-1 text-xs text-[#374151] hover:text-[#0A0E1A]">
                <ArrowLeft className="h-3 w-3" /> Back
            </Link>
            <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-blue-500/10 border border-blue-500/30 grid place-items-center rounded-sm">
                    <ShieldCheck className="h-5 w-5 text-[#0066FF]" strokeWidth={1.75} />
                </div>
                <div>
                    <div className="overline">Two-factor authentication</div>
                    <h2 className="font-display text-2xl font-black tracking-tighter">Verify your identity</h2>
                </div>
            </div>
            <p className="text-sm text-[#374151]">
                Enter the 6-digit code from your authenticator app to continue.
            </p>
            <form onSubmit={submit} className="space-y-5">
                <div className="flex justify-center">
                    <InputOTP maxLength={6} value={code} onChange={setCode} data-testid="two-fa-otp">
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
                {error && (
                    <div className="text-xs text-[#B91C1C] bg-red-500/10 border border-red-500/20 rounded-sm px-3 py-2 text-center" data-testid="two-fa-error">
                        {error}
                    </div>
                )}
                <Button
                    type="submit"
                    disabled={loading || code.length < 6}
                    className="w-full h-11 bg-blue-600 hover:bg-blue-700 rounded-sm"
                    data-testid="two-fa-submit"
                >
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Verify and sign in"}
                </Button>
                <div className="text-center text-xs text-[#4B5563]">Enter the 6-digit code sent by your authenticator/SMS workflow.</div>
            </form>
        </div>
    );
}

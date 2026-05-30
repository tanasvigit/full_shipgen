import { useState } from "react";
import { Link } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ArrowLeft, MailCheck, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function ForgotPassword() {
    const [email, setEmail] = useState("");
    const [sent, setSent] = useState(false);
    const [loading, setLoading] = useState(false);

    function submit(e) {
        e.preventDefault();
        setLoading(true);
        setTimeout(() => {
            setSent(true);
            setLoading(false);
            toast.success("Reset link sent");
        }, 700);
    }

    return (
        <div className="space-y-6" data-testid="forgot-password-page">
            <Link to="/auth" className="inline-flex items-center gap-1 text-xs text-[#374151] hover:text-[#0A0E1A]" data-testid="forgot-back">
                <ArrowLeft className="h-3 w-3" /> Back to sign in
            </Link>
            {!sent ? (
                <>
                    <div>
                        <div className="overline">Password recovery</div>
                        <h2 className="font-display text-3xl font-black tracking-tighter mt-1">Reset your password</h2>
                        <p className="text-sm text-[#374151] mt-2">
                            Enter the email associated with your Fleetbase account and we'll send a recovery link.
                        </p>
                    </div>
                    <form onSubmit={submit} className="space-y-4">
                        <div className="space-y-1.5">
                            <Label htmlFor="email" className="text-xs font-mono uppercase tracking-wider text-[#374151]">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="h-11 bg-[#F1F2F5] border-black/[0.08]"
                                data-testid="forgot-email"
                            />
                        </div>
                        <Button
                            type="submit"
                            disabled={loading}
                            className="w-full h-11 bg-blue-600 hover:bg-blue-700 rounded-sm"
                            data-testid="forgot-submit"
                        >
                            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send reset link"}
                        </Button>
                    </form>
                </>
            ) : (
                <div className="space-y-4 text-center">
                    <div className="mx-auto h-14 w-14 bg-blue-500/10 border border-blue-500/30 grid place-items-center rounded-md">
                        <MailCheck className="h-6 w-6 text-[#0066FF]" strokeWidth={1.75} />
                    </div>
                    <h2 className="font-display text-2xl font-black tracking-tighter">Check your inbox</h2>
                    <p className="text-sm text-[#374151]">
                        If an account exists for <span className="text-[#0A0E1A] font-mono">{email}</span>, you'll receive a recovery email shortly.
                    </p>
                    <Link to="/auth">
                        <Button variant="outline" className="border-black/[0.08] hover:bg-[#F1F2F5]" data-testid="forgot-return-button">
                            Return to sign in
                        </Button>
                    </Link>
                </div>
            )}
        </div>
    );
}

import PageHeader from "@/components/common/PageHeader";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { useCallback, useEffect, useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Building2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { iamService } from "@/services/iam";
import { parseTwoFaSettings, resolveTwoFaAfterSave } from "@/lib/iam/twoFa";
import TwoFaConfirmDialog from "@/components/iam/TwoFaConfirmDialog";
import { features } from "@/lib/features";
import { parseApiError } from "@/lib/errors";
import { normalizeIamPhone } from "@/lib/iam/phone";

const PASSWORD_HINT =
    "At least 8 characters with uppercase, lowercase, a number, and a symbol (not found in known breaches).";

export default function Account() {
    const { user, organizations, activeOrganization, switchOrganization, refresh } = useAuth();
    const currentUser = user || {
        name: "User",
        email: "",
        role: "Member",
        avatarColor: "bg-blue-600 text-white",
        avatarInitials: "U",
    };
    const [twoFa, setTwoFa] = useState(false);
    const [twoFaMethod, setTwoFaMethod] = useState("email");
    const [twoFaLoading, setTwoFaLoading] = useState(true);
    const [twoFaSaving, setTwoFaSaving] = useState(false);
    const [activeTab, setActiveTab] = useState("profile");
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [pendingTwoFa, setPendingTwoFa] = useState(null);
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [passwordBusy, setPasswordBusy] = useState(false);
    const [passwordError, setPasswordError] = useState("");
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [timezone, setTimezone] = useState("");
    const [profileBusy, setProfileBusy] = useState(false);
    const [profileError, setProfileError] = useState("");

    useEffect(() => {
        if (!user) return;
        setName(user.name || "");
        setEmail(user.email || "");
        setPhone(user.phone || "");
        setTimezone(user.timezone || user.raw?.timezone || "");
    }, [user?.id, user?.name, user?.email, user?.phone, user?.timezone, user?.raw?.timezone]);

    const loadTwoFa = useCallback(async () => {
        setTwoFaLoading(true);
        try {
            const settings = await iamService.getTwoFactorSettings();
            const parsed = parseTwoFaSettings(settings);
            setTwoFa(parsed.enabled);
            setTwoFaMethod(parsed.method);
        } catch (err) {
            const fallback = parseTwoFaSettings(user);
            setTwoFa(fallback.enabled);
            setTwoFaMethod(fallback.method);
            toast.error(parseApiError(err, "Could not load two-factor settings."));
        } finally {
            setTwoFaLoading(false);
        }
    }, [user]);

    useEffect(() => {
        if (features.twoFaEnabled && activeTab === "security") {
            loadTwoFa();
        }
    }, [activeTab, loadTwoFa]);

    const applyTwoFaChange = async (enabled) => {
        const prev = twoFa;
        const requested = { enabled, method: twoFaMethod };
        setTwoFaSaving(true);
        try {
            const settings = await iamService.saveTwoFactorSettings(requested);
            const saved = resolveTwoFaAfterSave(settings, requested);
            setTwoFa(saved.enabled);
            setTwoFaMethod(saved.method);
            toast.success(saved.enabled ? "Two-factor authentication enabled" : "Two-factor authentication disabled");
            setConfirmOpen(false);
            setPendingTwoFa(null);
        } catch (err) {
            setTwoFa(prev);
            toast.error(parseApiError(err, "Failed to update two-factor authentication."));
        } finally {
            setTwoFaSaving(false);
        }
    };

    const handleTwoFaToggle = (enabled) => {
        if (enabled === twoFa) return;
        setPendingTwoFa(enabled);
        setConfirmOpen(true);
    };

    const handleProfileUpdate = async () => {
        setProfileError("");
        const trimmedName = name.trim();
        const trimmedEmail = email.trim();
        const trimmedTimezone = timezone.trim();

        if (!trimmedName) {
            setProfileError("Name is required.");
            return;
        }
        if (!trimmedEmail) {
            setProfileError("Email is required.");
            return;
        }

        const normalizedPhone = normalizeIamPhone(phone);
        if (String(phone ?? "").trim() && !normalizedPhone) {
            setProfileError("Phone must be a valid number (e.g. +15551234567).");
            return;
        }

        setProfileBusy(true);
        try {
            await iamService.updateOwnProfile({
                name: trimmedName,
                email: trimmedEmail,
                ...(normalizedPhone ? { phone: normalizedPhone } : { phone: null }),
                ...(trimmedTimezone ? { timezone: trimmedTimezone } : {}),
            });
            await refresh();
            toast.success("Profile updated");
        } catch (err) {
            const message = parseApiError(err, "Failed to update profile.");
            setProfileError(message);
            toast.error(message);
        } finally {
            setProfileBusy(false);
        }
    };

    const handlePasswordUpdate = async () => {
        setPasswordError("");
        if (!currentPassword.trim()) {
            setPasswordError("Enter your current password.");
            return;
        }
        if (!newPassword.trim()) {
            setPasswordError("Enter a new password.");
            return;
        }
        if (newPassword !== confirmPassword) {
            setPasswordError("New password and confirmation do not match.");
            return;
        }
        setPasswordBusy(true);
        try {
            await iamService.validateCurrentPassword(currentPassword);
            await iamService.changeOwnPassword({
                password: newPassword,
                password_confirmation: confirmPassword,
            });
            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");
            toast.success("Password updated");
        } catch (err) {
            const message = parseApiError(err, "Failed to update password.");
            setPasswordError(message);
            toast.error(message);
        } finally {
            setPasswordBusy(false);
        }
    };

    return (
        <div data-testid="account-page">
            <PageHeader
                overline="Personal"
                title="My Account"
                description="Manage your profile, security and organization memberships."
            />
            <div className="p-6 max-w-4xl">
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="bg-[#F1F2F5] border border-black/[0.08] mb-5">
                        <TabsTrigger value="profile" data-testid="tab-profile">Profile</TabsTrigger>
                        <TabsTrigger value="security" data-testid="tab-security">Security</TabsTrigger>
                        <TabsTrigger value="organizations" data-testid="tab-organizations">Organizations</TabsTrigger>
                    </TabsList>

                    <TabsContent value="profile" className="space-y-5">
                        <div className="bg-white border border-black/[0.08] rounded-md p-5">
                            <div className="flex items-center gap-4 mb-6">
                                <div className={`h-16 w-16 text-white ${currentUser.avatarColor} grid place-items-center rounded-md`}>
                                    <span className="font-mono font-bold text-lg text-white">{currentUser.avatarInitials}</span>
                                </div>
                                <div>
                                    <div className="font-display text-xl font-bold tracking-tight">{currentUser.name}</div>
                                    <div className="text-sm text-[#374151]">{currentUser.role}</div>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <Label className="text-xs uppercase tracking-wider font-mono text-[#374151]">Full name</Label>
                                    <Input
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="bg-[#F1F2F5] border-black/[0.08]"
                                        data-testid="account-name"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-xs uppercase tracking-wider font-mono text-[#374151]">Email</Label>
                                    <Input
                                        type="email"
                                        autoComplete="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="bg-[#F1F2F5] border-black/[0.08]"
                                        data-testid="account-email"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-xs uppercase tracking-wider font-mono text-[#374151]">Phone</Label>
                                    <Input
                                        type="tel"
                                        autoComplete="tel"
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                        placeholder="+15551234567"
                                        className="bg-[#F1F2F5] border-black/[0.08]"
                                        data-testid="account-phone"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-xs uppercase tracking-wider font-mono text-[#374151]">Timezone</Label>
                                    <Input
                                        value={timezone}
                                        onChange={(e) => setTimezone(e.target.value)}
                                        placeholder="America/New_York"
                                        className="bg-[#F1F2F5] border-black/[0.08]"
                                        data-testid="account-timezone"
                                    />
                                </div>
                            </div>
                            {profileError ? (
                                <p className="text-sm text-red-600 mt-4" role="alert" data-testid="account-profile-error">
                                    {profileError}
                                </p>
                            ) : null}
                            <div className="flex justify-end mt-5">
                                <Button
                                    onClick={() => void handleProfileUpdate()}
                                    disabled={profileBusy}
                                    className="bg-blue-600 hover:bg-blue-700"
                                    data-testid="account-save"
                                >
                                    {profileBusy ? "Saving…" : "Save changes"}
                                </Button>
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="security" className="space-y-5">
                        <div className="bg-white border border-black/[0.08] rounded-md p-5 space-y-5" data-testid="account-security-card">
                            {features.twoFaEnabled ? (
                            <div className="flex items-start justify-between gap-4">
                                <div className="min-w-0">
                                    <div className="font-display font-semibold">Two-factor authentication</div>
                                    <div className="text-xs text-[#374151] mt-0.5">
                                        {twoFaLoading
                                            ? "Loading security settings…"
                                            : twoFa
                                              ? `Enabled — a 6-digit code is emailed to ${currentUser.email} on each sign in.`
                                              : "Off — sign-in only requires your password."}
                                    </div>
                                </div>
                                <Switch
                                    checked={twoFa}
                                    disabled={twoFaLoading || twoFaSaving}
                                    className="shrink-0"
                                    onCheckedChange={handleTwoFaToggle}
                                    data-testid="account-2fa-toggle"
                                />
                            </div>
                            ) : null}
                            <div className={`space-y-4 ${features.twoFaEnabled ? "pt-4 border-t border-black/[0.08]" : ""}`}>
                                <p className="text-xs text-[#4B5563]">{PASSWORD_HINT}</p>
                                {passwordError ? (
                                    <p className="text-sm text-red-600" role="alert" data-testid="account-password-error">
                                        {passwordError}
                                    </p>
                                ) : null}
                                <div className="space-y-4">
                                    <div className="space-y-1.5">
                                        <Label className="text-xs uppercase tracking-wider font-mono text-[#374151]">Current password</Label>
                                        <PasswordInput
                                            autoComplete="current-password"
                                            placeholder="••••••••"
                                            value={currentPassword}
                                            onChange={(e) => setCurrentPassword(e.target.value)}
                                            className="bg-[#F1F2F5] border-black/[0.08]"
                                            data-testid="account-current-password"
                                        />
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <Label className="text-xs uppercase tracking-wider font-mono text-[#374151]">New password</Label>
                                            <PasswordInput
                                                autoComplete="new-password"
                                                placeholder="••••••••"
                                                value={newPassword}
                                                onChange={(e) => setNewPassword(e.target.value)}
                                                className="bg-[#F1F2F5] border-black/[0.08]"
                                                data-testid="account-new-password"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label className="text-xs uppercase tracking-wider font-mono text-[#374151]">Confirm new password</Label>
                                            <PasswordInput
                                                autoComplete="new-password"
                                                placeholder="••••••••"
                                                value={confirmPassword}
                                                onChange={(e) => setConfirmPassword(e.target.value)}
                                                className="bg-[#F1F2F5] border-black/[0.08]"
                                                data-testid="account-confirm-password"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="flex justify-end">
                                <Button
                                    onClick={() => void handlePasswordUpdate()}
                                    disabled={passwordBusy}
                                    className="bg-blue-600 hover:bg-blue-700"
                                    data-testid="account-update-password"
                                >
                                    {passwordBusy ? "Updating…" : "Update password"}
                                </Button>
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="organizations" className="space-y-3">
                        {organizations.map((o) => (
                            <div key={o.id} className="bg-white border border-black/[0.08] rounded-md p-4 flex items-center gap-4" data-testid={`account-org-${o.id}`}>
                                <div className="h-10 w-10 bg-[#F1F2F5] border border-black/[0.08] grid place-items-center rounded-sm">
                                    <Building2 className="h-4 w-4 text-[#374151]" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="font-medium">{o.name}</div>
                                    <div className="text-xs text-[#4B5563] font-mono uppercase tracking-wider">{o.plan} · {o.role}</div>
                                </div>
                                <Button variant="outline" onClick={() => switchOrganization(o.id)} className="bg-transparent border-black/[0.08] hover:bg-[#F1F2F5]">
                                    {activeOrganization?.id === o.id ? "Active" : "Switch"}
                                </Button>
                            </div>
                        ))}
                    </TabsContent>
                </Tabs>
            </div>

            {features.twoFaEnabled ? (
            <TwoFaConfirmDialog
                open={confirmOpen}
                onOpenChange={(open) => {
                    setConfirmOpen(open);
                    if (!open) setPendingTwoFa(null);
                }}
                enabling={Boolean(pendingTwoFa)}
                destination={currentUser.email || "your email"}
                loading={twoFaSaving}
                onConfirm={() => {
                    if (pendingTwoFa == null) return;
                    void applyTwoFaChange(pendingTwoFa);
                }}
            />
            ) : null}
        </div>
    );
}

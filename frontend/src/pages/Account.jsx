import PageHeader from "@/components/common/PageHeader";
import { Input } from "@/components/ui/input";
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

export default function Account() {
    const { user, organizations, activeOrganization, switchOrganization } = useAuth();
    const currentUser = user || {
        name: "User",
        email: "",
        role: "Member",
        avatarColor: "bg-blue-600",
        avatarInitials: "U",
    };
    const [twoFa, setTwoFa] = useState(false);
    const [twoFaMethod, setTwoFaMethod] = useState("email");
    const [twoFaLoading, setTwoFaLoading] = useState(true);
    const [twoFaSaving, setTwoFaSaving] = useState(false);
    const [activeTab, setActiveTab] = useState("profile");
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [pendingTwoFa, setPendingTwoFa] = useState(null);

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
            toast.error(err?.friendlyMessage || "Could not load two-factor settings.");
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
            toast.error(err?.friendlyMessage || "Failed to update two-factor authentication.");
        } finally {
            setTwoFaSaving(false);
        }
    };

    const handleTwoFaToggle = (enabled) => {
        if (enabled === twoFa) return;
        setPendingTwoFa(enabled);
        setConfirmOpen(true);
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
                                <div className={`h-16 w-16 ${currentUser.avatarColor} grid place-items-center rounded-md`}>
                                    <span className="font-mono font-bold text-lg">{currentUser.avatarInitials}</span>
                                </div>
                                <div>
                                    <div className="font-display text-xl font-bold tracking-tight">{currentUser.name}</div>
                                    <div className="text-sm text-[#374151]">{currentUser.role}</div>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <Label className="text-xs uppercase tracking-wider font-mono text-[#374151]">Full name</Label>
                                    <Input defaultValue={currentUser.name} className="bg-[#F1F2F5] border-black/[0.08]" data-testid="account-name" />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-xs uppercase tracking-wider font-mono text-[#374151]">Email</Label>
                                    <Input defaultValue={currentUser.email} className="bg-[#F1F2F5] border-black/[0.08]" data-testid="account-email" />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-xs uppercase tracking-wider font-mono text-[#374151]">Phone</Label>
                                    <Input defaultValue={currentUser.phone} className="bg-[#F1F2F5] border-black/[0.08]" data-testid="account-phone" />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-xs uppercase tracking-wider font-mono text-[#374151]">Timezone</Label>
                                    <Input defaultValue={currentUser.timezone} className="bg-[#F1F2F5] border-black/[0.08]" data-testid="account-timezone" />
                                </div>
                            </div>
                            <div className="flex justify-end mt-5">
                                <Button onClick={() => toast.success("Profile updated")} className="bg-blue-600 hover:bg-blue-700" data-testid="account-save">
                                    Save changes
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
                            <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 ${features.twoFaEnabled ? "pt-4 border-t border-black/[0.08]" : ""}`}>
                                <div className="space-y-1.5">
                                    <Label className="text-xs uppercase tracking-wider font-mono text-[#374151]">Current password</Label>
                                    <Input type="password" placeholder="••••••••" className="bg-[#F1F2F5] border-black/[0.08]" />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-xs uppercase tracking-wider font-mono text-[#374151]">New password</Label>
                                    <Input type="password" placeholder="••••••••" className="bg-[#F1F2F5] border-black/[0.08]" />
                                </div>
                            </div>
                            <div className="flex justify-end">
                                <Button onClick={() => toast.success("Password updated")} className="bg-blue-600 hover:bg-blue-700">
                                    Update password
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

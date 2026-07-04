import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Bell, Blocks, ChevronRight, Code2, HeartPulse, Rocket, ShieldCheck, User } from "lucide-react";
import PageHeader from "@/components/common/PageHeader";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useTenant } from "@/contexts/TenantContext";
import BillingPlansTab from "@/components/settings/BillingPlansTab";
import { apiClient } from "@/lib/api";
import { parseApiError } from "@/lib/errors";
import { getSettingsModuleEngines } from "@/lib/engineAccess";
import { getSettingsConsoleLinks } from "@/lib/settingsNavigation";
import { resolveConsoleAdmin } from "@/lib/consoleAccess";

const MODULE_ICONS = {
  iam: ShieldCheck,
  developers: Code2,
  registry: Blocks,
};

const CONSOLE_LINK_ICONS = {
  notifications: Bell,
  account: User,
  onboarding: Rocket,
  "platform-health": HeartPulse,
};

const NOTIFICATION_ITEMS = [
  { key: "orderCreated", title: "Order created", desc: "When a new order is placed in any network" },
  { key: "orderDispatched", title: "Order dispatched", desc: "When dispatcher assigns a driver" },
  { key: "driverOffline", title: "Driver offline", desc: "When a driver goes offline mid-shift" },
  { key: "dailySummary", title: "Daily summary", desc: "End-of-day operations report" },
];

export default function Settings() {
  const { activeOrganization, user, hasPermission, canFleetops, sessionScope } = useAuth();
  const { branding, preferences, updateBranding, updatePreferences, tenantProfile } = useTenant();

  const isConsoleAdmin = useMemo(
    () => resolveConsoleAdmin(user, { canFleetops, hasPermission }),
    [user, canFleetops, hasPermission],
  );

  const settingsModules = useMemo(
    () =>
      getSettingsModuleEngines({
        isConsoleAdmin,
        isAdmin: isConsoleAdmin,
        sessionScope,
        hasPermission,
        canFleetops,
        canYardModule: () => false,
        userPermissions: user?.permissions,
      }),
    [isConsoleAdmin, sessionScope, hasPermission, canFleetops, user?.permissions],
  );

  const settingsConsoleLinks = useMemo(
    () => getSettingsConsoleLinks({ isConsoleAdmin, isAdmin: isConsoleAdmin }),
    [isConsoleAdmin],
  );

  const [orgName, setOrgName] = useState(activeOrganization?.name || "");
  const [contact, setContact] = useState("");
  const [description, setDescription] = useState("");
  const [mailboxTestBusy, setMailboxTestBusy] = useState("");

  const saveOrg = () => {
    toast.success("Organization profile saved");
  };

  const saveBranding = () => {
    updateBranding({
      primaryColor: branding.primaryColor,
      accentColor: branding.accentColor,
      logoUrl: branding.logoUrl,
      productName: branding.productName,
    });
    toast.success("Branding applied to workspace");
  };

  const savePrefs = () => {
    updatePreferences(preferences);
    toast.success("Operational preferences saved");
  };

  const toggleNotif = (key, channel) => {
    const current = preferences.notifications?.[key] || { email: false, push: false };
    updatePreferences({
      notifications: {
        ...preferences.notifications,
        [key]: { ...current, [channel]: !current[channel] },
      },
    });
  };

  const sendMailboxTest = async (mailbox) => {
    setMailboxTestBusy(mailbox);
    try {
      const { data } = await apiClient.post("/settings/test-mailbox-email", { mailbox });
      toast.success(data?.message || `${mailbox} test email sent.`);
    } catch (error) {
      toast.error(parseApiError(error, `Failed to send ${mailbox} test email.`));
    } finally {
      setMailboxTestBusy("");
    }
  };

  return (
    <div data-testid="settings-page">
      <PageHeader
        overline="Workspace"
        title="Organization Settings"
        description="Company profile, branding, notifications, and billing for your tenant."
      />
      <div className="p-6 max-w-4xl">
        <Tabs defaultValue="org">
          <TabsList className="bg-[#F1F2F5] border border-black/[0.08] mb-5 flex-wrap h-auto">
            <TabsTrigger value="org" data-testid="settings-tab-org">
              Organization
            </TabsTrigger>
            <TabsTrigger value="branding" data-testid="settings-tab-branding">
              Branding
            </TabsTrigger>
            <TabsTrigger value="operations" data-testid="settings-tab-operations">
              Operations
            </TabsTrigger>
            <TabsTrigger value="notifications" data-testid="settings-tab-notifications">
              Notifications
            </TabsTrigger>
            <TabsTrigger value="billing" data-testid="settings-tab-billing">
              Billing
            </TabsTrigger>
            <TabsTrigger value="modules" data-testid="settings-tab-modules">
              Platform modules
            </TabsTrigger>
          </TabsList>

          <TabsContent value="org" className="space-y-5">
            <div className="bg-white border border-black/[0.08] rounded-md p-5 space-y-4">
              <p className="text-xs text-[#6B7280]">
                Tenant: <span className="font-mono">{tenantProfile.orgId}</span> · Plan:{" "}
                {tenantProfile.planName}
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs uppercase tracking-wider font-mono text-[#374151]">
                    Organization name
                  </Label>
                  <Input
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    className="bg-[#F1F2F5] border-black/[0.08]"
                    data-testid="settings-org-name"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs uppercase tracking-wider font-mono text-[#374151]">
                    Primary contact
                  </Label>
                  <Input
                    value={contact}
                    onChange={(e) => setContact(e.target.value)}
                    placeholder="ops@company.com"
                    className="bg-[#F1F2F5] border-black/[0.08]"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs uppercase tracking-wider font-mono text-[#374151]">
                    Currency
                  </Label>
                  <Input
                    value={preferences.currency}
                    onChange={(e) => updatePreferences({ currency: e.target.value })}
                    className="bg-[#F1F2F5] border-black/[0.08]"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs uppercase tracking-wider font-mono text-[#374151]">
                    Default timezone
                  </Label>
                  <Input
                    value={preferences.timezone}
                    onChange={(e) => updatePreferences({ timezone: e.target.value })}
                    className="bg-[#F1F2F5] border-black/[0.08]"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs uppercase tracking-wider font-mono text-[#374151]">
                  Description
                </Label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="bg-[#F1F2F5] border-black/[0.08] min-h-[90px]"
                />
              </div>
              <div className="flex justify-end">
                <Button onClick={saveOrg} className="bg-blue-600 hover:bg-blue-700" data-testid="settings-save">
                  Save changes
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="branding" className="space-y-5">
            <div className="bg-white border border-black/[0.08] rounded-md p-5 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs uppercase tracking-wider font-mono text-[#374151]">
                    Product name
                  </Label>
                  <Input
                    value={branding.productName}
                    onChange={(e) => updateBranding({ productName: e.target.value })}
                    className="bg-[#F1F2F5] border-black/[0.08]"
                    data-testid="settings-product-name"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs uppercase tracking-wider font-mono text-[#374151]">
                    Logo URL
                  </Label>
                  <Input
                    value={branding.logoUrl}
                    onChange={(e) => updateBranding({ logoUrl: e.target.value })}
                    placeholder="https://…"
                    className="bg-[#F1F2F5] border-black/[0.08]"
                    data-testid="settings-logo-url"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs uppercase tracking-wider font-mono text-[#374151]">
                    Primary color
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={branding.primaryColor}
                      onChange={(e) => updateBranding({ primaryColor: e.target.value })}
                      className="w-12 h-9 p-1 cursor-pointer"
                    />
                    <Input
                      value={branding.primaryColor}
                      onChange={(e) => updateBranding({ primaryColor: e.target.value })}
                      className="bg-[#F1F2F5] border-black/[0.08] font-mono text-xs flex-1"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs uppercase tracking-wider font-mono text-[#374151]">
                    Accent color
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={branding.accentColor}
                      onChange={(e) => updateBranding({ accentColor: e.target.value })}
                      className="w-12 h-9 p-1 cursor-pointer"
                    />
                    <Input
                      value={branding.accentColor}
                      onChange={(e) => updateBranding({ accentColor: e.target.value })}
                      className="bg-[#F1F2F5] border-black/[0.08] font-mono text-xs flex-1"
                    />
                  </div>
                </div>
              </div>
              {branding.logoUrl && (
                <img src={branding.logoUrl} alt="" className="h-10 object-contain" />
              )}
              <div className="flex justify-end">
                <Button onClick={saveBranding} className="bg-blue-600 hover:bg-blue-700">
                  Apply branding
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="operations" className="space-y-3">
            {[
              {
                key: "autoRefreshList",
                label: "Auto-refresh order list",
                desc: "Background refresh when realtime events arrive",
              },
              {
                key: "showRiskAlerts",
                label: "Show delivery risk alerts",
                desc: "Surface SLA and assignment risks on orders hub",
              },
            ].map((item) => (
              <div
                key={item.key}
                className="flex items-center justify-between bg-white border border-black/[0.08] rounded-md p-4"
              >
                <div>
                  <div className="font-medium text-sm">{item.label}</div>
                  <div className="text-xs text-[#374151]">{item.desc}</div>
                </div>
                <Switch
                  checked={Boolean(preferences.operations?.[item.key])}
                  onCheckedChange={(v) =>
                    updatePreferences({
                      operations: { ...preferences.operations, [item.key]: v },
                    })
                  }
                />
              </div>
            ))}
            <div className="flex justify-end">
              <Button onClick={savePrefs} variant="outline" className="border-black/[0.08]">
                Save preferences
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-3">
            {NOTIFICATION_ITEMS.map((n, i) => {
              const prefs = preferences.notifications?.[n.key] || { email: false, push: false };
              return (
                <div
                  key={n.key}
                  className="flex items-center justify-between bg-white border border-black/[0.08] rounded-md p-4"
                  data-testid={`settings-notif-${i}`}
                >
                  <div>
                    <div className="font-medium text-sm">{n.title}</div>
                    <div className="text-xs text-[#374151]">{n.desc}</div>
                  </div>
                  <div className="flex items-center gap-6 text-xs text-[#374151]">
                    <label className="flex items-center gap-2">
                      Email{" "}
                      <Switch checked={prefs.email} onCheckedChange={() => toggleNotif(n.key, "email")} />
                    </label>
                    <label className="flex items-center gap-2">
                      Push{" "}
                      <Switch checked={prefs.push} onCheckedChange={() => toggleNotif(n.key, "push")} />
                    </label>
                  </div>
                </div>
              );
            })}
          </TabsContent>

          <TabsContent value="billing">
            <BillingPlansTab />
            <div className="mt-4 bg-white border border-black/[0.08] rounded-md p-5 space-y-3" data-testid="settings-mailbox-tests">
              <div className="overline mb-1">Mailbox test emails</div>
              <p className="text-sm text-[#4B5563]">
                Send one-click test emails to your own account using specific mailbox routing.
              </p>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  onClick={() => sendMailboxTest("support")}
                  disabled={mailboxTestBusy.length > 0}
                  data-testid="settings-test-support-mail"
                >
                  {mailboxTestBusy === "support" ? "Sending support test..." : "Send support test mail"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => sendMailboxTest("billing")}
                  disabled={mailboxTestBusy.length > 0}
                  data-testid="settings-test-billing-mail"
                >
                  {mailboxTestBusy === "billing" ? "Sending billing test..." : "Send billing test mail"}
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="modules" className="space-y-6">
            <div className="space-y-3">
              <div className="overline px-1">Console</div>
              {settingsConsoleLinks.map((link) => {
                const Icon = CONSOLE_LINK_ICONS[link.id] || User;
                return (
                  <Link
                    key={link.id}
                    to={link.to}
                    data-testid={`settings-console-${link.id}`}
                    className="flex items-center gap-4 bg-white border border-black/[0.08] rounded-md p-5 hover:border-[#0066FF]/30 hover:bg-[#0066FF]/[0.03] transition-colors group"
                  >
                    <div className="h-11 w-11 shrink-0 grid place-items-center rounded-md bg-[#0066FF]/10 border border-[#0066FF]/20 text-[#0066FF]">
                      <Icon className="h-5 w-5" strokeWidth={1.75} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-display font-bold text-[#0A0E1A]">{link.label}</div>
                      <div className="text-sm text-[#4B5563] mt-0.5">{link.description}</div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-[#4B5563] group-hover:text-[#0066FF] shrink-0" strokeWidth={2} />
                  </Link>
                );
              })}
            </div>

            <div className="space-y-3">
              <div className="overline px-1">Platform modules</div>
              {settingsModules.length === 0 ? (
                <div className="bg-white border border-black/[0.08] rounded-md p-5 text-sm text-[#4B5563]">
                  No platform modules are available for your account.
                </div>
              ) : (
                settingsModules.map((module) => {
                  const Icon = MODULE_ICONS[module.id] || ShieldCheck;
                  return (
                    <Link
                      key={module.id}
                      to={module.to}
                      data-testid={`settings-module-${module.id}`}
                      className="flex items-center gap-4 bg-white border border-black/[0.08] rounded-md p-5 hover:border-[#0066FF]/30 hover:bg-[#0066FF]/[0.03] transition-colors group"
                    >
                      <div className="h-11 w-11 shrink-0 grid place-items-center rounded-md bg-[#0066FF]/10 border border-[#0066FF]/20 text-[#0066FF]">
                        <Icon className="h-5 w-5" strokeWidth={1.75} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-display font-bold text-[#0A0E1A]">{module.label}</div>
                        <div className="text-sm text-[#4B5563] mt-0.5">{module.description}</div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-[#4B5563] group-hover:text-[#0066FF] shrink-0" strokeWidth={2} />
                    </Link>
                  );
                })
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

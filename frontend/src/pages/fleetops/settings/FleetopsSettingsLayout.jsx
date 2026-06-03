import { Link, Outlet, useLocation } from "react-router-dom";
import PageHeader from "@/components/common/PageHeader";
import { FleetopsSettingsProvider } from "@/contexts/fleetops/FleetopsSettingsContext";
import { t } from "@/i18n";

const tabs = [
  { to: "/fleet-ops/settings", label: "Overview" },
  { to: "/fleet-ops/settings/navigator", label: "Navigator" },
  { to: "/fleet-ops/settings/routing", label: "Routing" },
  { to: "/fleet-ops/settings/orchestrator", label: "Orchestrator" },
  { to: "/fleet-ops/settings/scheduling", label: "Scheduling" },
  { to: "/fleet-ops/settings/notifications", label: "Notifications" },
  { to: "/fleet-ops/settings/avatars", label: "Avatars" },
  { to: "/fleet-ops/settings/payments", label: "Payments" },
  { to: "/fleet-ops/settings/entity-editing", label: "Entity editing" },
];

export default function FleetopsSettingsLayout() {
  const location = useLocation();

  return (
    <FleetopsSettingsProvider>
      <div data-testid="fleetops-settings-layout">
        <PageHeader
          overline="FleetOps Platform"
          title={t("fleetops.day3.settings.title", "Settings")}
          description={t(
            "fleetops.day3.settings.description",
            "Org-level FleetOps settings: routing, notifications, payments, and navigator.",
          )}
        />
        <div className="px-6 py-4 border-b border-black/[0.08] flex flex-wrap gap-2">
          {tabs.map((tab) => {
            const active = location.pathname === tab.to;
            return (
              <Link
                key={tab.to}
                to={tab.to}
                className={`px-3 py-1.5 rounded-md text-sm border ${
                  active ? "border-[#0066FF] text-[#0066FF] bg-[#0066FF]/[0.08]" : "border-black/[0.08] text-[#374151]"
                }`}
                data-testid={`fleetops-settings-tab-${tab.label.toLowerCase().replace(/\s+/g, "-")}`}
              >
                {tab.label}
              </Link>
            );
          })}
        </div>
        <Outlet />
      </div>
    </FleetopsSettingsProvider>
  );
}

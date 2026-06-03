import { Link } from "react-router-dom";
import PageHeader from "@/components/common/PageHeader";
import { IAM_HEADER_SHORTCUTS } from "@/lib/iam/headerShortcuts";
import { useAuth } from "@/contexts/AuthContext";
import { useMemo } from "react";
import { t } from "@/i18n";

export default function IamHome() {
  const { hasPermission } = useAuth();

  const links = useMemo(
    () => IAM_HEADER_SHORTCUTS.filter((item) => !item.permission || hasPermission(item.permission)),
    [hasPermission],
  );

  return (
    <div data-testid="iam-home-page" className="max-w-4xl">
      <PageHeader
        breadcrumbs={[{ label: "IAM" }]}
        overline={t("iam.home.overline", "Identity & Access")}
        title={t("iam.home.title", "Identity & Access Management")}
        description={t(
          "iam.home.description",
          "Manage users, roles, groups, and policies for your organization.",
        )}
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-6">
        {links.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.to}
              to={item.to}
              data-testid={`iam-home-link-${item.testId.replace("iam-shortcut-", "")}`}
              className="flex items-start gap-3 rounded-xl border border-black/[0.08] bg-white p-4 hover:border-[#0066FF]/40 hover:shadow-sm transition-all"
            >
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-[#0066FF]/10 text-[#0066FF]">
                <Icon className="h-5 w-5" strokeWidth={1.75} />
              </div>
              <div>
                <div className="font-semibold text-[#0A0E1A]">{item.label}</div>
                <div className="text-xs text-[#6B7280] mt-0.5 font-mono truncate">{item.to}</div>
              </div>
            </Link>
          );
        })}
      </div>
      {links.length === 0 && (
        <p className="text-sm text-[#6B7280] mt-4" data-testid="iam-home-no-access">
          {t("iam.home.noAccess", "You do not have permission to access IAM modules.")}
        </p>
      )}
    </div>
  );
}
